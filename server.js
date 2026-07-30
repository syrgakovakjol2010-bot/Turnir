require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ========== JWT Middleware ==========
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Токен не предоставлен" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: "Неверный токен" });
  }
}

function judgeOnly(req, res, next) {
  if (req.user.role !== "JUDGE" && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Доступ только для судей" });
  }
  next();
}

// ========== AUTH ==========
app.post("/api/auth/register", async (req, res) => {
  const { nickname, pubgId, discordId } = req.body;
  try {
    const user = await prisma.user.create({
      data: { nickname, pubgId, discordId },
    });
    const token = jwt.sign(
      { id: user.id, nickname: user.nickname, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token, user });
  } catch (e) {
    res.status(400).json({ error: "Пользователь уже существует или ошибка данных" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { pubgId } = req.body;
  const user = await prisma.user.findUnique({ where: { pubgId } });
  if (!user) return res.status(404).json({ error: "Пользователь не найден" });
  const token = jwt.sign(
    { id: user.id, nickname: user.nickname, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
  res.json({ token, user });
});

app.get("/api/me", auth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json(user);
});

// ========== TOURNAMENTS ==========
app.get("/api/tournaments", async (req, res) => {
  const tournaments = await prisma.tournament.findMany({
    include: {
      regs: { include: { team: true } },
      matches: true,
    },
    orderBy: { startTime: "desc" },
  });
  res.json(tournaments);
});

app.get("/api/tournaments/:id", async (req, res) => {
  const tournament = await prisma.tournament.findUnique({
    where: { id: req.params.id },
    include: {
      regs: { include: { team: { include: { members: true, captain: true } } } },
      matches: { include: { results: { include: { team: true } } } },
    },
  });
  if (!tournament) return res.status(404).json({ error: "Турнир не найден" });
  res.json(tournament);
});

app.post("/api/tournaments", auth, judgeOnly, async (req, res) => {
  const data = req.body;
  const tournament = await prisma.tournament.create({ data });
  res.json(tournament);
});

// ========== TEAM REGISTRATION ==========
app.post("/api/tournaments/register", auth, async (req, res) => {
  const { tournamentId, teamName, members } = req.body;

  // Жёсткая проверка SQUAD: от 3 до 5 участников
  if (!members || members.length < 3 || members.length > 5) {
    return res.status(400).json({
      error: "Неверный состав команды. SQUAD: от 3 до 5 участников.",
    });
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { regs: { include: { team: { include: { members: true } } } } },
  });

  if (!tournament) return res.status(404).json({ error: "Турнир не найден" });
  if (tournament.status !== "REGISTRATION_OPEN") {
    return res.status(400).json({ error: "Регистрация закрыта" });
  }
  if (tournament.regs.length >= tournament.maxTeams) {
    return res.status(400).json({ error: "Все слоты заняты" });
  }

  // Проверка на дубли pubgId среди уже зарегистрированных команд
  const registeredPubgIds = new Set();
  for (const reg of tournament.regs) {
    for (const m of reg.team.members) {
      registeredPubgIds.add(m.pubgId);
    }
  }
  for (const m of members) {
    if (registeredPubgIds.has(m.pubgId)) {
      return res.status(400).json({
        error: `Игрок с PUBG ID ${m.pubgId} уже зарегистрирован в другой команде`,
      });
    }
  }

  // Создание команды
  const team = await prisma.team.create({
    data: {
      name: teamName,
      captainId: req.user.id,
      members: {
        create: members.map((m) => ({ pubgId: m.pubgId, name: m.name })),
      },
    },
    include: { members: true },
  });

  const registration = await prisma.tournamentRegistration.create({
    data: {
      tournamentId,
      teamId: team.id,
      status: "APPROVED",
    },
    include: { team: { include: { members: true } } },
  });

  res.json({ team, registration });
});

// ========== MATCH RESULTS ==========
function calcPlacementPoints(placement) {
  if (placement === 1) return 10;
  if (placement === 2) return 6;
  if (placement === 3) return 5;
  if (placement === 4) return 4;
  if (placement === 5) return 3;
  if (placement === 6) return 2;
  if (placement === 7 || placement === 8) return 1;
  return 0;
}

app.post("/api/matches/result", auth, judgeOnly, async (req, res) => {
  const { matchId, results } = req.body;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { tournament: true },
  });
  if (!match) return res.status(404).json({ error: "Матч не найден" });

  const created = await prisma.$transaction(
    results.map((r) =>
      prisma.matchResult.create({
        data: {
          matchId,
          teamId: r.teamId,
          placement: r.placement,
          kills: r.kills,
          totalPoints: calcPlacementPoints(r.placement) + r.kills,
        },
      })
    )
  );

  res.json(created);
});

// ========== LEADERBOARD ==========
app.get("/api/tournaments/:id/leaderboard", async (req, res) => {
  const tournamentId = req.params.id;

  const results = await prisma.matchResult.findMany({
    where: { match: { tournamentId } },
    include: { team: true },
  });

  const leaderboard = {};
  for (const r of results) {
    if (!leaderboard[r.teamId]) {
      leaderboard[r.teamId] = {
        teamId: r.teamId,
        teamName: r.team.name,
        totalPoints: 0,
        totalKills: 0,
        matchesPlayed: 0,
        bestPlacement: 999,
      };
    }
    const entry = leaderboard[r.teamId];
    entry.totalPoints += r.totalPoints;
    entry.totalKills += r.kills;
    entry.matchesPlayed += 1;
    if (r.placement < entry.bestPlacement) entry.bestPlacement = r.placement;
  }

  const sorted = Object.values(leaderboard).sort(
    (a, b) => b.totalPoints - a.totalPoints
  );
  res.json(sorted);
});

// ========== TEAMS ==========
app.get("/api/teams/:id", async (req, res) => {
  const team = await prisma.team.findUnique({
    where: { id: req.params.id },
    include: { members: true, captain: true, results: true },
  });
  if (!team) return res.status(404).json({ error: "Команда не найдена" });
  res.json(team);
});

// ========== SEED DATA (один раз при старте) ==========
async function seed() {
  const count = await prisma.tournament.count();
  if (count > 0) return;

  await prisma.tournament.create({
    data: {
      title: "PUBG ARENA KG — Открытый турнир #1",
      bannerUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
      prizePool: "10 000 сом + Гарнитура HyperX",
      prizeTop1: "5 000 сом",
      prizeTop3: "2 500 сом",
      prizeTop5: "Игровая гарнитура для ПК/Телефона",
      prizeTop10: "660 UC",
      format: "SQUAD",
      maxTeams: 16,
      status: "REGISTRATION_OPEN",
      startTime: new Date(Date.now() + 86400000 * 3),
    },
  });

  await prisma.tournament.create({
    data: {
      title: "PUBG ARENA KG — Кубок Выходных",
      bannerUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80",
      prizePool: "5 000 сом",
      prizeTop1: "3 000 сом",
      prizeTop3: "1 500 сом",
      prizeTop5: "500 сом",
      prizeTop10: null,
      format: "SQUAD",
      maxTeams: 12,
      status: "REGISTRATION_OPEN",
      startTime: new Date(Date.now() + 86400000 * 7),
    },
  });

  console.log("✅ Seed data inserted");
}

// ========== START ==========
app.listen(PORT, async () => {
  await seed();
  console.log(`🚀 PUBG ARENA KG запущен на http://localhost:${PORT}`);
});
