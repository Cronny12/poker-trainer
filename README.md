# Poker Trainer Monorepo

Full-stack poker training app scaffold with:
- `backend/`: Java 17 + Spring Boot REST API
- `frontend/`: React (JSX) + Tailwind CSS + Vite

## Product flow implemented
- Landing page -> Sign in/Register -> Authenticated app home
- Includes a no-account `Demo mode` (local browser data) so you can enter the app without backend connectivity
- Home options:
  - Brain teaser
  - Free daily chips
  - Start match
  - View profile
  - Edit profile
- Daily chips claim endpoint and UI
- Daily brain teaser + streak-based chip rewards
- 9-max bot match setup (you + 8 bots)
  - 10 strategy types
  - Per-seat strategy selection or random fill
- Live table route for playable match hands
- Win/loss history logged after full table result (bust or win)

## Tech stack
- Backend: Java 17, Spring Boot 3, Maven
- Frontend: Node.js, React, JSX, Tailwind CSS, Vite

## Local development

### 1) Backend
```bash
cd backend
mvn spring-boot:run
```
API default: `http://localhost:8080/api`

### 2) Frontend
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```
Frontend default: `http://localhost:5173`

## Environment variables

### Frontend
- `VITE_API_BASE_URL` (default `http://localhost:8080/api`)

### Backend
- `APP_CORS_ORIGINS` (optional comma-separated origins)

## API overview
- Auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
- Chips:
  - `GET /api/chips/balance`
  - `POST /api/chips/daily-claim`
- Brain teaser:
  - `GET /api/brain-teaser/today`
  - `POST /api/brain-teaser/submit`
- Match:
  - `GET /api/match/strategies`
  - `POST /api/match/start`
  - `POST /api/match/record`
  - `GET /api/match/history`
- Profile:
  - `GET /api/profile`
  - `PUT /api/profile`

## Vercel deployment

Use Vercel for `frontend/` and deploy backend separately (Render/Railway/Fly/etc).

### Frontend on Vercel
1. Import this repo in Vercel.
2. Set the project Root Directory to `frontend`.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Set `VITE_API_BASE_URL` to your deployed backend API URL (e.g. `https://your-api.example.com/api`).

`frontend/vercel.json` already includes SPA rewrites.

## Notes
- Backend persistence is currently in-memory for rapid prototyping.
- Passwords are SHA-256 hashed for demo purposes; for production, use a hardened password hashing function (e.g. bcrypt/argon2) and a real database.
