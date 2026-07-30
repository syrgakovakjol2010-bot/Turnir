# 🏆 PUBG ARENA KG

Киберспортивная платформа для PUBG Mobile в Кыргызстане.

## 📁 Структура проекта

```
pubg-arena-kg/
├── .env                    # Переменные окружения
├── .gitignore
├── package.json
├── server.js               # Express + Prisma backend
├── prisma/
│   └── schema.prisma       # Схема базы данных
└── public/
    └── index.html          # SPA фронтенд
```

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Применение схемы базы данных

```bash
npx prisma db push
```

### 3. Запуск сервера

```bash
npm start
```

Сервер запустится на `http://localhost:3000`

## 🔑 Переменные окружения (.env)

| Переменная    | Описание                          |
|---------------|-----------------------------------|
| DATABASE_URL  | PostgreSQL connection string      |
| JWT_SECRET    | Секретный ключ для JWT            |
| PORT          | Порт сервера (по умолчанию 3000)  |
| NEON_REST_API | Neon REST API endpoint            |

## 📡 API Endpoints

### Auth
- `POST /api/auth/register` — Регистрация
- `POST /api/auth/login` — Вход по PUBG ID
- `GET /api/me` — Текущий пользователь

### Tournaments
- `GET /api/tournaments` — Список турниров
- `GET /api/tournaments/:id` — Детали турнира
- `POST /api/tournaments` — Создать турнир (судья)
- `POST /api/tournaments/register` — Регистрация команды

### Matches
- `POST /api/matches/result` — Ввод результатов (судья)
- `GET /api/tournaments/:id/leaderboard` — Турнирная таблица

### Teams
- `GET /api/teams/:id` — Информация о команде

## ⚙️ Особенности

- **SQUAD проверка**: строго 3–5 участников при регистрации
- **Защита от дублей**: один PUBG ID не может быть в двух командах одного турнира
- **Система очков PUBG Mobile**:
  - 1 место = 10 очков
  - 2 место = 6 очков
  - 3 место = 5 очков
  - 4 место = 4 очка
  - 5 место = 3 очка
  - 6 место = 2 очка
  - 7–8 места = 1 очко
  - 9–16 места = 0 очков
  - Каждый килл = +1 очко
- **Валюта**: все суммы в **сом**
- **Двуязычный интерфейс**: RU / KG
- **Адаптивный дизайн**: мобильная нижняя навигация

## 🎨 Дизайн

Светлая киберспортивная тема в стиле BigPlay.gg:
- Фон: `#F8FAFC`
- Белые карточки с мягкой тенью
- Округлые углы
- Акцентный цвет: `#F59E0B` (золотой)
- Без лишнего текста и массивных футеров
