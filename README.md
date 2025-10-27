# QuickPoll

QuickPoll is a real-time polling application built as a Turborepo monorepo. The app allows users to create polls, vote once per poll, like/unlike polls, share polls and see real-time updates via WebSockets.

## Table of contents

- [System design & architecture](#system-design--architecture)
- [Data model](#data-model)
- [APIs & real-time events](#apis--real-time-events)
- [Authentication](#authentication)
- [Environment variables](#environment-variables)
- [Run the project locally](#run-the-project-locally)
- [Scripts](#scripts)
- [Development notes & deployment](#development-notes--deployment)
- [Contributing](#contributing)

## System design & architecture

High-level components:

- Frontend: Next.js (app directory), client-side components use Clerk for auth and Socket.IO client for real-time updates.
- Backend: Express server exposing a REST API for polls and using Socket.IO to broadcast poll events.
- Database: MongoDB (accessed with Mongoose) storing Polls, Votes and Likes.
- Authentication: The frontend uses Clerk (`@clerk/nextjs`) to sign in users. The backend trusts short headers (set by the frontend) to identify the user (see `apps/backend/src/middleware/auth.ts`). In production you should verify tokens server-side.

Communication flows:

- The frontend calls REST endpoints under `/api/polls` on the backend for CRUD operations.
- After state-changing operations (create, vote, like, delete), the backend emits Socket.IO events (e.g. `poll-created`, `poll-updated`, etc.) to notify all connected clients.
- The frontend listens to Socket.IO events and updates the UI optimistically and reactively.

Architecture:

Frontend (Next.js + Clerk) <--HTTP/REST--> Backend (Express + Mongoose + Socket.IO)

For clarity, here's a diagram showing how the pieces interact (HTTP, WebSocket messages, and database):

```text
							  +----------------------+                        +--------------------------------+
							  |      Frontend        |  <--HTTP/REST/JSON---> |          Backend (API)         |
							  |   Next.js + Clerk    |                        | Express + Socket.IO + Mongoose |
							  +----------------------+                        +--------------------------------+
										 |    ^                                           ^       ^
										 |    |  Socket.IO (real-time events/messages)    |       |
							Sign-in /    |    \-------------------------------------------/       |
							user flows   |                                                        |
										 v                                                        |
						+-------------------------------+                                         |
						|   Socket.IO Client (browser)  |---------------------------------------->|
						|  (socket.io-client) connects  |  join rooms / emits actions / listens   |
						+-------------------------------+  for server events:                     |
										 |                                      - poll-created    |
										 |                                      - poll-updated    |
										 |                                      - poll-voted      |
										 v                                      - poll-liked      |
							  +-----------------------+                     +-------------------------------+
							  |       MongoDB         | <--- Mongoose --->  |  Vote / Like models (indexes) |
							  | (Polls, Votes, Likes) |                     |  Poll model (options, counts) |
							  +-----------------------+                     +-------------------------------+

Notes:
- The Frontend calls REST endpoints on the Backend for CRUD operations under `/api/polls`.
- The Backend updates MongoDB and emits Socket.IO events to notify connected clients.
- The Frontend listens to Socket.IO events and updates the UI in real-time (also does optimistic updates).
- Authentication in the demo is header-based (frontend sets `x-user-*` headers). For production, verify Clerk tokens server-side.
```

## Data model

Key models are implemented with Mongoose in `apps/backend/src/models`:

- Poll
	- title, description, options (each option has id, text, votes), createdBy (user id), createdByName, totalVotes, likes, timestamps
- Vote
	- pollId, optionId, userId, userName, createdAt. There's a compound unique index on (pollId, userId) to enforce one vote per user per poll.
- Like
	- pollId, userId, createdAt. Compound unique index on (pollId, userId) to ensure one like per user per poll.

## APIs & real-time events

Base REST path: `/api/polls`

- GET /api/polls
	- Returns list of polls. If user headers are present, returns `userVotes` and `userLikes` maps for that user.
- GET /api/polls/:id
	- Returns a single poll and optional `userVote` / `userLiked` for the requesting user.
- POST /api/polls
	- Create poll (requires auth headers). Body: { title, description?, options: string[] }.
- POST /api/polls/:id/vote
	- Cast a vote (requires auth headers). Body: { optionId }. One vote per user per poll. Responds 409 if already voted.
- POST /api/polls/:id/like
	- Toggle like for the authenticated user.
- DELETE /api/polls/:id
	- Delete poll (requires auth headers). Only the creator can delete.

Socket events (server emits):

- `poll-created` : new poll object
- `poll-updated` : updated poll object
- `poll-deleted` : { pollId }
- `poll-voted` : { pollId, poll }
- `poll-liked` : { pollId, poll }

Socket client actions (frontend):

- `join-poll` / `leave-poll` (used to join poll-specific rooms for targeted updates)

## Authentication

- Frontend: uses Clerk via `@clerk/nextjs` components (see `apps/frontend/components/Header.tsx` and pages). When signed in, the frontend sets three custom headers for the API calls: `x-user-id`, `x-user-name`, and `x-user-email` using helper functions in `apps/frontend/lib/api.ts`.
- Backend: current implementation uses header-based auth middleware (`apps/backend/src/middleware/auth.ts`). This is intentionally simple for demo purposes. In production you should verify Clerk tokens on the server to authenticate requests securely (for instance, using Clerk's server SDK or token verification endpoints).

Auth behaviour and failure modes:

- If `authenticateUser` middleware does not find required headers, the request returns 401.
- `optionalAuth` middleware populates request.user when headers exist but does not fail when missing.

## Environment variables

Create `.env` in `apps/backend` and `.env.local` in `apps/frontend` (for Next).

Example `apps/backend/.env`:

MONGO_URI=mongodb://localhost:27017/quickpoll
PORT=4000
FRONTEND_URL=http://localhost:3000

Example `apps/frontend/.env.local`:

NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000

Notes:

- The frontend expects `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` to point at the backend.
- In production use secure URLs (https) and ensure CORS and Clerk configurations are correct.

## Run the project locally

Prerequisites:

- Node.js >= 18
- npm (the repo is configured to use npm workspaces) or your preferred package manager
- MongoDB (local or remote) and a `MONGO_URI`

Recommended quick start (PowerShell):

```powershell
# from repo root
npm install

# start both apps using turborepo (recommended):
npm run dev

# Alternatively run apps individually in separate shells:
cd .\apps\backend
npm install
npm run dev

cd ..\..\apps\frontend
npm install
npm run dev
```

To seed the database with sample polls (backend):

```powershell
cd .\apps\backend
npm run seed
```

Frontend defaults to http://localhost:3000 and backend http://localhost:4000. If you change ports, update the environment variables accordingly.

## Scripts

Root (monorepo):

- npm run dev — runs `turbo run dev` (starts apps in development)
- npm run build — runs `turbo run build`
- npm run lint — runs `turbo run lint`

Backend (`apps/backend`):

- npm run dev — runs server with `ts-node-dev` (fast local dev)
- npm run seed — seeds sample polls into MongoDB
- npm run build — transpiles TypeScript into `dist`

Frontend (`apps/frontend`):

- npm run dev — `next dev`
- npm run build — `next build`
- npm start — `next start`

## Development notes & deployment

- Auth: the frontend uses Clerk for user sign-in and UIs. The backend currently trusts header values set by the frontend. Replace header-based auth with server-side token verification using Clerk for production.
- Real-time: Socket.IO is used for real-time updates. The backend creates a Socket.IO server and emits events on poll changes. The frontend uses `socket.io-client` and `getSocket()` helper in `apps/frontend/lib/socket.ts`.
- DB indexes: Vote and Like models have unique compound indexes to prevent duplicates. When deploying, ensure indexes are created (Mongoose will create them at startup unless disabled).

Deployment suggestions:

- Host frontend in a platform that supports Next.js (Vercel, Netlify with Next, or self-hosted Node). Ensure environment variables for NEXT_PUBLIC_API_URL and NEXT_PUBLIC_SOCKET_URL point to the backend.
- Host backend on a Node-capable host (Heroku, Railway, Render, Fly, or a VPS) and expose a socket-enabled URL. Ensure CORS and socket origins are configured (see `process.env.FRONTEND_URL`).
- Use a managed MongoDB (MongoDB Atlas) for production.

## Future Improvements / Roadmap

This project is intentionally small and focused, but here are planned improvements and ideas to evolve QuickPoll. These are reasonable next steps — I (the maintainer) will be working on several of them as I learn new tools and expand the app.

- FastAPI Backend: I plan to re-implement the backend in Python using FastAPI. This is a learning project for me — FastAPI is great for async APIs and typing, and I'll replicate the existing Express endpoints and Socket.IO real-time behavior (likely with `uvicorn` + `fastapi-socketio` or `websockets`/`ws` pairing).

- Authentication: Clerk is used here to bootstrap auth quickly. I may replace it with an in-house authentication server (separate service) later to gain full control over user data, session flows, and custom features (email/password, OAuth, JWTs, refresh flows, rate limits, and admin tools).

- AI-powered option suggestions: provide suggested poll options using a lightweight AI assistant (on-device or via an LLM) to help users craft better, varied options when creating polls.

- Rich media & comments: allow images or videos for polls, and add threaded comments/discussion per poll. This involves storage (S3/Cloud storage), moderation, and additional DB models.

- Enhanced analytics: add detailed analytics (time-series voting trends, per-option growth, user segmentation, exportable reports) and an analytics dashboard for poll creators.

- Moderation & safety: content moderation (automated and manual), spam detection, rate limiting, and abuse protections.

- Performance & scaling: optimize DB queries, add caching for hot polls, and plan socket cluster/redis adapter for Socket.IO (or alternative pub/sub) to support horizontal scaling.

- Testing & CI: add automated tests (unit, integration, and API contract tests) and a CI pipeline to run linting, type checks, and tests on PRs.

## Troubleshooting

- Backend logs: watch the terminal running `apps/backend` for connection and error messages.
- CORS/socket errors: ensure `FRONTEND_URL` and `NEXT_PUBLIC_*` env variables are set correctly and the client origin is allowed.
- Authentication: if the frontend shows signed-in user but API returns 401, verify that `x-user-id` and `x-user-name` headers are being set (see `apps/frontend/lib/api.ts`).

## Contributing

Contributions are welcome. Please open issues or PRs and follow the repository coding style. Keep changes small and include tests where practical.

---