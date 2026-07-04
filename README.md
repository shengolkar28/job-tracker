# TRACKHUNT. — Job Application Tracker

[![Live Demo](https://img.shields.io/badge/Live_Demo-tracknhunt.vercel.app-black?style=flat-square&logo=vercel)](https://tracknhunt.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Node.js_%2F_Express-black?style=flat-square&logo=nodedotjs)](https://nodejs.org)
[![Frontend](https://img.shields.io/badge/Frontend-React_%2F_Vite-black?style=flat-square&logo=react)](https://react.dev)

A full-stack SaaS application to track job applications, visualize progress, and stay on top of your job search.

---


## Features

- **JWT authentication** with httpOnly refresh token cookies — access tokens expire in 15 minutes, refresh tokens rotate every 7 days
- **Full job CRUD** — add, edit, delete, filter by status, search by company or role, and paginate results
- **Kanban board** with drag-and-drop status updates powered by `@hello-pangea/dnd`
- **Analytics dashboard** — charts for application status breakdown, weekly application volume, and top companies applied to
- **Email reminders via cron job** — runs daily at 9AM, flags applications that have gone stale with no follow-up
- **Redis caching** with cache-aside pattern — analytics responses cached for 5 minutes and invalidated on any job mutation
- **Pagination** with configurable page size across all job list queries
- **Brutalist design system** — neon yellow, black, sharp edges, no border-radius softness

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS, Recharts, @hello-pangea/dnd |
| Backend | Node.js, Express.js |
| Database | PostgreSQL, Prisma ORM |
| Caching | Redis (ioredis) |
| Auth | JWT, bcrypt, httpOnly cookies |
| Email | Nodemailer, node-cron |
| Deployment | Vercel (frontend), Render (backend), Supabase (DB) |
| Containerization | Docker, Docker Compose |

---

## System Architecture

### REST API

All routes are versioned under `/api`. Job and analytics routes sit behind an `authenticate` middleware that validates the JWT access token from the `Authorization` header. Auth routes (`/register`, `/login`, `/refresh`, `/logout`) are public.

### Authentication Flow

On login, the server issues a short-lived JWT access token (15 min) returned in the response body, and a long-lived refresh token (7 days) set as an httpOnly cookie. When the access token expires, the client calls `POST /api/auth/refresh` — the server reads the cookie, validates the refresh token, and issues a new pair. This rotation pattern limits the blast radius of a compromised access token while keeping the refresh token out of JavaScript scope entirely.

### Redis Cache-Aside

Analytics endpoints are expensive aggregations over the jobs table. On each request, the handler checks Redis first. On a miss, it queries PostgreSQL, writes the result to Redis with a 5-minute TTL, and returns it. On any job write (create, update, delete, status change), the analytics cache keys are invalidated immediately. This keeps the dashboard responsive under load without serving stale data for more than one write cycle.

### Cron-Based Email Reminders

A `node-cron` job fires daily at 09:00 server time. It queries for applications in an `APPLIED` or `INTERVIEWING` state that haven't been updated in more than a configurable threshold of days. For each stale application, it sends a reminder email via Nodemailer using the SMTP credentials in the environment. The cron runs in-process within the Express server, so no separate worker infrastructure is required for this workload.

---

## API Reference

### Auth — `/api/auth`

| Method | Path | Description | Auth Required |
|---|---|---|---|
| `POST` | `/register` | Create a new user account | No |
| `POST` | `/login` | Authenticate and receive tokens | No |
| `POST` | `/logout` | Clear the refresh token cookie | No |
| `POST` | `/refresh` | Rotate access + refresh token pair | No (cookie) |
| `GET` | `/me` | Return the authenticated user's profile | Yes |

### Jobs — `/api/jobs`

| Method | Path | Description | Auth Required |
|---|---|---|---|
| `GET` | `/` | List jobs with filtering, search, and pagination | Yes |
| `POST` | `/` | Create a new job application | Yes |
| `GET` | `/:id` | Retrieve a single job by ID | Yes |
| `PUT` | `/:id` | Update all fields of a job | Yes |
| `DELETE` | `/:id` | Delete a job application | Yes |
| `PUT` | `/:id/status` | Update only the status field (used by Kanban) | Yes |

### Analytics — `/api/analytics`

| Method | Path | Description | Auth Required |
|---|---|---|---|
| `GET` | `/summary` | Total application count and aggregate stats | Yes |
| `GET` | `/by-status` | Application counts grouped by status | Yes |
| `GET` | `/by-week` | Weekly application volume for the past N weeks | Yes |
| `GET` | `/by-company` | Top companies by number of applications | Yes |

---

## Local Setup

### Prerequisites

- Node.js >= 18
- PostgreSQL running locally (or a Supabase connection string)
- Redis running locally (or use Docker Compose)

### 1. Clone the repository

```bash
git clone https://github.com/shengolkar28/job-tracker.git
cd job-tracker
```

### 2. Backend

```bash
cd backend
npm install
```

Copy the example env file and fill in your values:

```bash
cp ../.env.example .env
```

Run database migrations:

```bash
npx prisma migrate dev
npx prisma generate
```

Start the development server:

```bash
npm run dev
```

The backend runs on `http://localhost:5000` by default.

### 3. Frontend

```bash
cd ../frontend
npm install
```

Create a `.env` file:

```bash
cp .env.example .env
```

Start the dev server:

```bash
npm run dev
```

The frontend runs on `http://localhost:5173` by default.

### 4. Docker (optional, runs everything together)

```bash
docker compose up --build
```

This starts the backend, frontend (served via Nginx), PostgreSQL, and Redis as a single stack.

---

## Environment Variables

### Backend (`.env`)

| Variable | Description |
|---|---|
| `NODE_ENV` | Runtime environment — `development` or `production` |
| `DATABASE_URL` | PostgreSQL connection string (e.g. Supabase pooler URL) |
| `JWT_ACCESS_SECRET` | Secret key for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret key for signing refresh tokens |
| `JWT_ACCESS_EXPIRY` | Access token lifetime — default `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token lifetime — default `7d` |
| `CLIENT_URL` | CORS allowed origin — your frontend URL |
| `REDIS_URL` | Redis connection string — `redis://localhost:6379` or `redis://redis:6379` in Docker |
| `SMTP_HOST` | SMTP server host for email reminders |
| `SMTP_PORT` | SMTP server port — typically `587` |
| `SMTP_USER` | SMTP login username / email address |
| `SMTP_PASS` | SMTP login password or app password |
| `EMAIL_FROM` | Sender name and address shown in reminder emails |

### Frontend (`.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API — e.g. `http://localhost:5000/api` |

---

## Key Technical Decisions

**PostgreSQL over MongoDB** — Job application data is inherently relational: users own jobs, jobs have statuses, analytics queries involve GROUP BY and date windowing. PostgreSQL's ACID compliance and native aggregation functions make these queries straightforward. A document store would require either denormalization or application-level aggregation for the same results.

**JWT with httpOnly cookies** — Storing tokens in `localStorage` exposes them to any XSS payload running in the page. The refresh token never touches JavaScript; it travels only via cookie headers. The short-lived access token in memory limits the exposure window if intercepted.

**Redis cache-aside over read-through** — The analytics queries run on every dashboard load. Rather than adding a caching layer that intercepts the ORM, cache-aside keeps the data access logic explicit: check cache, miss → query → write cache. Invalidation on mutation is a single key deletion, which keeps the implementation simple without a separate cache server process.

**Prisma over raw SQL or other ORMs** — Prisma's generated client provides type-safe query builders that catch schema mismatches at compile time rather than at runtime. Its migration system maintains a clear audit trail of schema changes, which matters when the database is hosted externally on Supabase and schema state cannot be inferred from the file system alone.

---

## Live Demo

[https://tracknhunt.vercel.app](https://tracknhunt.vercel.app)

---
