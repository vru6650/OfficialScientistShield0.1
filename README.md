# ScientistShield 2.0

![Node.js](https://img.shields.io/badge/node-%3E%3D18.0-brightgreen) ![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green) ![License](https://img.shields.io/badge/license-MIT-blue) ![Build](https://img.shields.io/badge/build-Vite%20%2B%20Express-orange)

ScientistShield 2.0 is a modern MERN learning workspace that combines tutorials, quizzes, competitive programming problems, search, and safe multi-language code runners. It ships with an Express API, a Vite + React frontend, optional Elasticsearch integration, and a macOS-inspired desktop that keeps admin tools, readers, and utilities visible across sessions.

---

## Table of Contents
- [Quick Start](#quick-start)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Layout](#project-layout)
- [Environment & Configuration](#environment--configuration)
- [Running the App](#running-the-app)
- [Available Scripts](#available-scripts)
- [API Surface](#api-surface)
- [Code Runners & Debugger](#code-runners--debugger)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Desktop Workspace](#desktop-workspace)
- [WhiteSur Theme](#whitesur-theme)
- [Contributing](#contributing)
- [Version History](#version-history)

## Quick Start
1) Install dependencies (API + client):

```bash
npm install
npm install --prefix client
```

2) Copy `.env.example` to `.env` and set a unique `JWT_SECRET` plus your MongoDB URI.

3) Run both dev servers from the repo root (use two terminals):

```bash
# API
npm run dev

# Client (Vite)
npm run dev --prefix client
```

4) Open http://localhost:5173. Vite proxies `/api/*` to http://localhost:3000.

5) Want a production-like run? Build then serve:

```bash
npm run build   # reinstalls deps, builds client to client/dist
npm start       # serves API + static client bundle
```

## Tech Stack
| Area | Choices |
| ---- | ------- |
| Frontend | React 18, Vite SPA (Redux Toolkit) • Next.js 16 App Router (SSR/RSC) with Tailwind v4 + shadcn/ui primitives, Zustand stores for auth/theme |
| Backend | Express modular monolith (domain modules + controller/service/repository), Mongoose, JWT auth, cookie sessions, optional PostgreSQL connectivity |
| Search | Optional Elasticsearch; graceful in-app fallback if disabled |
| Runtimes | JS/TS, Python, C/C++, Java, C# code runners with safety timeouts |
| Tooling | Nodemon, Node test runner, UUID utilities |

## Architecture
```
┌───────────────────────────────────────────────────────────────────┐
│                               Client                              │
│  React + Vite • Redux Toolkit • Tailwind • TipTap • Framer Motion │
└───────────────▲──────────────────────────────┬────────────────────┘
                │                              │ REST / WebSockets*
                │                              │
┌───────────────┴──────────────────────────────▼────────────────────┐
│                             API (Node)                            │
│ Express • Mongoose • JWT • Cookie Parser • Code Runner Services   │
└───────────────▲──────────────────────────────┬────────────────────┘
                │                              │
                │ MongoDB                      │ Optional Elasticsearch
                ▼                              ▼
        Persistence Layer              Full-Text Search Layer
```
*WebSockets are an extension point used by the visualizer; you can leave them disabled without breaking REST flows.

The `temp/` directory is created at runtime for code execution scratch files and is safe to purge between runs. Each run cleans its own workspace in a `finally` block, and production deployments should still schedule periodic cleanup (cron/systemd timer) as defense in depth.

## Project Layout
- `api/` – Express API with modular domains in `api/modules/` (`auth`, `user`, `content`, `quiz`, etc.) plus shared infrastructure/config/bootstrap.
- `client/` – Vite + React app with `pages/`, `components/`, `redux/`, `hooks/`, `services/`, and theme tokens.
- `uploads/` – Manual testing artifacts. Scrub sensitive data after use; prefer `temp/` for disposable files.
- `temp/` – Ephemeral workspace created by code runners (git-ignored).
- `package.json` – Shared scripts for both workspaces.

## Environment & Configuration
The API provides defaults so it can boot without a custom `.env`, but you should set production values explicitly.

| Name | Required | Default | Description |
| ---- | -------- | ------- | ----------- |
| `JWT_SECRET` | ✅ | `viren` (dev fallback) | Secret for signing JWTs. Override in any non-local environment. |
| `MONGO_URI` | ✅ | `mongodb://0.0.0.0:27017/myappp` | MongoDB connection string. |
| `POSTGRES_URI` | ➖ | *(empty)* | Optional PostgreSQL connection string for transactional modules. |
| `PORT` | ➖ | `3000` | Express server port. |
| `CORS_ORIGIN` | ➖ | `http://localhost:5173` | Allowed origin for cookies/CORS in dev. |
| `VITE_API_URL` | ➖ | *(empty)* | Axios base URL for the client; empty uses same origin/proxy. |
| `ELASTICSEARCH_DISABLED` | ➖ | `false` | Set `true` to fully disable Elasticsearch integration. |
| `ELASTICSEARCH_NODE` | ➖ | — | Elasticsearch node URL. |
| `ELASTICSEARCH_USERNAME` / `ELASTICSEARCH_PASSWORD` | ➖ | — | Basic auth credentials. |
| `ELASTICSEARCH_API_KEY` | ➖ | — | Alternative auth; takes precedence when present. |
| `ELASTICSEARCH_INDEX_PREFIX` | ➖ | `scientistshield` | Prefix applied to created indices. |
| `CODE_RUNNER_MODE` | ➖ | `auto` | `local` to use host toolchains, `docker` to force container isolation. Defaults to `docker` in production and `local` otherwise. |
| `CODE_RUNNER_DOCKER_IMAGE_PYTHON` | ➖ | — | Docker image for Python runner (required in `docker` mode). |
| `CODE_RUNNER_DOCKER_IMAGE_CPP` | ➖ | — | Docker image for C/C++ runner (required in `docker` mode). |
| `CODE_RUNNER_DOCKER_IMAGE_JAVA` | ➖ | — | Docker image for Java runner (required in `docker` mode). |
| `CODE_RUNNER_DOCKER_IMAGE_CSHARP` | ➖ | — | Docker image for C# runner (required in `docker` mode). |
| `CODE_RUNNER_MEMORY` | ➖ | `256m` | Docker memory limit for code runners. |
| `CODE_RUNNER_CPUS` | ➖ | `0.5` | Docker CPU limit for code runners. |
| `CODE_RUNNER_PIDS` | ➖ | `128` | Docker PID limit for code runners. |
| `CODE_RUNNER_TMPFS` | ➖ | `64m` | Docker `/tmp` size for code runners. |
| `CODE_RUNNER_NETWORK` | ➖ | `none` | Docker network mode for code runners (`none` disables outbound network). |
| `CODE_RUNNER_JOB_WAIT_TIMEOUT_MS` | ➖ | `15000` | Default wait timeout for queue-based code runner jobs. |
| `CODE_RUNNER_JOB_RETENTION_MS` | ➖ | `300000` | How long completed code runner jobs stay in memory for polling. |

Client-side `.env` (`client/.env`) only needs `VITE_API_URL` when you are not using same-origin requests.

## Running the App
**Development**
- Run `npm run dev` for the API (nodemon) and `npm run dev --prefix client` for the Vite SPA.
- Vite proxies `/api/*` to `http://localhost:3000` so CORS stays simple.

**Next.js front-end (App Router, SSR/SEO-first)**
- A Next.js App Router frontend now ships in `client-next` for edge-friendly, server-rendered pages (tutorials/problems) with React Server Components.
- Set `NEXT_PUBLIC_API_URL=http://localhost:3000` in `client-next/.env.local` to point at the Express API.
- Run with two terminals: `npm run dev` (API on 3000) and `npm run dev:next` (Next.js on 3001). For production, use `npm run build:next && npm run start:next` or deploy the Next app separately while keeping the API at `/api/*`.
- Tailwind CSS v4 is wired with shadcn/ui primitives (button, card, badge, input) and a `components.json` manifest for adding more blocks with the shadcn CLI.

**Production / Preview**
- `npm run build` (reinstalls deps as written, then builds the client into `client/dist`).
- `npm start` serves the Express API and the built SPA from `client/dist`.
- API 404s return JSON; non-API GETs fall back to the SPA shell.

## Available Scripts
| Command | Location | Description |
| ------- | -------- | ----------- |
| `npm run dev` | root | Start Express with nodemon + ts-node/register style reloading. |
| `npm run dev --prefix client` | root | Launch Vite dev server with HMR. |
| `npm run dev:next` | root | Launch Next.js App Router dev server on port 3001 (`client-next`). |
| `npm run build` | root | Reinstalls deps, then builds the React app to `client/dist`. |
| `npm run build:next` | root | Build the Next.js app for production. |
| `npm start` | root | Serve Express in production mode and host the built client. |
| `npm run start:next` | root | Start the built Next.js app on port 3001. |
| `npm test` | root | Run backend unit/integration tests via Node's native test runner (`api/**/*.test.js`). |

Run commands from the repository root unless noted.

## Frontend State Management
- Vite SPA keeps Redux Toolkit + redux-persist for backwards compatibility.
- Next.js app (`client-next`) uses lightweight Zustand stores for auth (`useAuthStore`) and theme (`useThemeStore`); prefer these for new client work to reduce boilerplate.

## API Surface
- **Auth & Users**: `/api/auth` (signup/signin), `/api/user`
- **Content**: `/api/post`, `/api/tutorial`, `/api/problems`, `/api/pages`
- **Assessments**: `/api/quiz` (submissions are also written to PostgreSQL when `POSTGRES_URI` is configured)
- **Files**: `/api/files` for uploads/file management
- **Search**: `/api/search` with Elasticsearch acceleration when enabled; falls back to scored in-app search when disabled
- **Code Execution** (`POST { code: string }`):
  - `/api/code/run-js` – JavaScript VM sandbox
  - `/api/code/run-python` – Docker sandbox in production; local `python3`/`python` in dev
  - `/api/code/run-cpp` – Docker sandbox in production; local C/C++ toolchain in dev
  - `/api/code/run-java` – Docker sandbox in production; local JDK in dev
  - `/api/code/run-csharp` – Docker sandbox in production; local .NET SDK/dotnet-script/csi/scriptcs in dev
  - `/api/code/jobs` – queue a code execution task on a separate worker process (optional async flow)
  - `/api/code/jobs/:jobId` – poll queued worker job status/results

Runtimes are optional. When missing, endpoints respond with user-friendly guidance instead of hard failures.

## Code Runners & Debugger
- In-app editor exposes a step-by-step debugger (Play/Pause, Step Into/Over/Out, Run to Cursor, breakpoint toggles).
- Supports Python, C/C++, JavaScript, and Java with visual traces via Python Tutor when online; Python tracing runs locally when offline.
- Visual cues: current line (green), next line (red), breakpoints (pink dots). Locals, call stack, heap objects, and stdout are shown in side panels.
 - Server-side runners default to Docker isolation in production with CPU/memory caps and `--network none`. Configure images and limits via the `CODE_RUNNER_*` environment variables.

## Testing
- Backend tests live beside controllers in `api/**/*.test.js`.
- Run `npm test` from the root; covers controllers, routes, services, and utilities.
- Add fixtures under `temp/` when needed; keep them out of version control.

## Backend Evolution Roadmap (recommended)
- **Framework**: NestJS with modular DI, class-validator pipes, and OpenAPI docs. Start as an Express adapter; swap to Fastify later if desired.
- **Database**: PostgreSQL via Prisma for relational data (users/roles/quizzes/submissions). Keep MongoDB for unstructured tutorial/problem content; keep Elasticsearch for search.
- **Caching & rate limits**: Redis for sessions, response caching (tutorial/problem lists), and runner rate limiting (e.g., `@nestjs/throttler` with Redis store).
- **Observability**: Add health checks via `@nestjs/terminus`, structured logging (pino), and request IDs across services.

## Troubleshooting
- **MongoDB connection failures**: verify `MONGO_URI` and that the database is reachable.
- **CORS/auth in dev**: ensure `CORS_ORIGIN` matches the Vite URL and that the Vite proxy is active.
- **Elasticsearch errors**: set `ELASTICSEARCH_DISABLED=true` or supply valid credentials.
- **Missing runtimes**: install the language toolchains noted above or expect graceful error messages from the code execution endpoints.

## Desktop Workspace
Mission Control-style desktop keeps every utility visible—no hidden scenes.

**Controls**
- Focus Mode (`Cmd+Opt+F` / `Ctrl+Alt+F`) hides supporting utilities and keeps the primary window front and center.
- Mission Control (`Cmd+Up` / `Ctrl+Up`) fans out windows for drag-and-drop arrangement.
- Quick Look (Spacebar) previews the focused window without changing focus.
- Hot corners trigger Quick Look, Mission Control, and Focus Mode.

**Persistence keys (localStorage)**
```
scientistshield.desktop.windowState.v2    // Window positions, sizes, z-index, focus memory
scientistshield.desktop.hotCorners.v1     // Enabled state and per-corner actions
scientistshield.desktop.scratchpad        // Scratchpad text content
```
Clear these keys when you need a clean slate during development or QA.

### Ebook Reader Pro (advanced)
- Drag-and-drop EPUB/PDF with auto TOC, chapter/time-left stats, and resume-from-last-location.
- Dual modes: scroll or paged view with keyboard/touch/page-size controls, optional auto-scroll, and fullscreen focus.
- Reading Control Center: theme presets (day/sepia/mint/dusk/night), typography sliders (size, line/word/paragraph spacing, letter-spacing, weight), width/margin tweaks, and brightness.
- Power tools: multi-color highlights & underlines, inline notes, bookmarks, case/whole-word search with next/prev jump, and highlight recall.
- Study aids: line-focused reading guide, high-contrast toggle, image hide, in-panel dictionary lookup, read-aloud via Web Speech voices, clipboard copy of selections.
- Stateful by design: highlights, bookmarks, layout, and paged progress persist in `localStorage` per book.

## WhiteSur Theme
The client UI follows a WhiteSur (macOS Big Sur) inspired theme with frosted glass surfaces, rounded corners, and accent `#0A84FF`.

- Icons: `client/public/icons/whitesur`. Switch packs at runtime:
  - `localStorage.setItem('iconPack', 'whitesur'); location.reload();`
  - Reset: `localStorage.removeItem('iconPack'); location.reload();`
- Header uses macOS-style window controls; `glass-effect` utility adapts to light/dark.
- PWA manifest `theme_color` mirrors the accent color for cohesive installs.

## Contributing
1. Create a feature branch from `main`.
2. Implement focused changes and include tests where practical.
3. Run `npm test` and confirm green builds.
4. Submit a PR summarizing scope, impacted endpoints/pages, and screenshots for UI updates.

## Version History
ScientistShield_0.1 · ScientistShield0.2 · ScientistShield1.0 · ScientistShield2.0 · finaldock2
# OfficialScientistShield0.1
# OfficialScientistShield0.1
