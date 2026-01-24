# ScientistShield 2.0

![Node.js](https://img.shields.io/badge/node-%3E%3D18.0-brightgreen) ![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green) ![License](https://img.shields.io/badge/license-MIT-blue) ![Build](https://img.shields.io/badge/build-Vite%20%2B%20Express-orange)

ScientistShield 2.0 is a modern MERN knowledge platform that bundles tutorials, quizzes, problems, search, and safe multi‑language code runners into a single learning experience. The project ships with a production-ready Express backend, a Vite + React frontend, and optional Elasticsearch integration for full‑text search. A macOS-inspired desktop workspace keeps admin tools, readers, and utilities organized across sessions without hiding windows behind scenes.

---

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Directory Layout](#directory-layout)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Highlights](#api-highlights)
- [Code Runners & Debugger](#code-runners--debugger)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [WhiteSur Theme](#whitesur-theme)

## Features
- **Content Authoring** – Tutorials, posts, and rich pages powered by TipTap with reading helpers, syntax highlighting, and media embedding.
- **Assessments** – Quiz builder with grading workflows, result storage, and admin tools.
- **Problem Solving** – Competitive programming style problems that expose hints, starter code, and constraints to learners.
- **Search** – Full‑text search backed by Elasticsearch (with graceful fallbacks if disabled).
- **Safe Execution** – Sandbox endpoints for JavaScript, Python, C/C++, Java, and C# with defensive timeouts and helpful failure messages.
- **Authentication** – JWT + cookie sessions, role‑based routes, and secure API middlewares.
- **Operations Ready** – Production build script, shared logger, centralized error handler, and environment driven configuration.
- **Desktop Workspace** – Mission Control, focus mode, and dock controls deliver a macOS-like productivity flow.

## Architecture
```
┌───────────────────────────────────────────────────────────────────┐
│                               Client                              │
│  React 18 + Vite • Redux Toolkit • Tailwind • TipTap • Framer     │
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
        Persistence Layer              Full‑Text Search Layer
```
\* WebSockets are an optional extension point for real‑time collaboration or notifications.

The `temp/` directory is created at runtime to host transient files for code execution. It is ignored by git and safe to purge between runs.

## Directory Layout
- `api/` – Express API with routes, controllers, models, services, middleware, and utilities.
- `client/` – Vite + React application featuring pages, components, hooks, and service modules.
- `temp/` – Ephemeral workspace for code runners. Generated on demand.
- `package.json` – Manages shared scripts for both workspaces.

## Getting Started
### Prerequisites
- Node.js **18+** and npm
- MongoDB instance (local or hosted)
- Optional: Elasticsearch node for full search (otherwise disable it)

### 1. Install dependencies
```bash
npm install
npm install --prefix client
```

### 2. Configure environment
Create a `.env` file in the project root. A sample with sensible defaults is provided. Minimum recommended values:

```env
JWT_SECRET=change-me
MONGO_URI=mongodb://127.0.0.1:27017/scientistshield
PORT=3000
CORS_ORIGIN=http://localhost:5173

# Client -> API base (leave empty to rely on same-origin/proxy in dev)
VITE_API_URL=http://localhost:3000

# Optional search (disable if not using)
ELASTICSEARCH_DISABLED=true
# or supply connection credentials:
# ELASTICSEARCH_NODE=http://localhost:9200
# ELASTICSEARCH_USERNAME=elastic
# ELASTICSEARCH_PASSWORD=changeme
# ELASTICSEARCH_API_KEY=<base64>
# ELASTICSEARCH_INDEX_PREFIX=scientistshield
```

### 3. Run in development
Use two terminals so both servers stay hot-reloaded.

```bash
# Terminal A – API
npm run dev

# Terminal B – Client (Vite)
npm run dev --prefix client
```

Vite proxies `/api/*` requests to `http://localhost:3000` during development.

### 4. Build for production
```bash
npm run build     # builds the React client into client/dist
npm start         # serves Express API + static client bundle
```

The Express server serves the SPA from `client/dist` and exposes the API under `/api`.

## Environment Variables
| Name | Required | Default | Description |
| ---- | -------- | ------- | ----------- |
| `JWT_SECRET` | ✅ | — | Secret used to sign JWTs. |
| `MONGO_URI` | ✅ | `mongodb://0.0.0.0:27017/myappp` | MongoDB connection string. |
| `PORT` | ➖ | `3000` | Express server port. |
| `CORS_ORIGIN` | ➖ | `http://localhost:5173` | Allowed origin for cookies/CORS. |
| `VITE_API_URL` | ➖ | *(empty)* | Client Axios base URL; empty uses same origin/proxy. |
| `ELASTICSEARCH_DISABLED` | ➖ | `false` | Set `true`/`1` to fully disable external search integration. |
| `ELASTICSEARCH_NODE` | ➖ | — | Elasticsearch node URL. |
| `ELASTICSEARCH_USERNAME` / `ELASTICSEARCH_PASSWORD` | ➖ | — | Basic auth credentials for Elasticsearch. |
| `ELASTICSEARCH_API_KEY` | ➖ | — | Alternative to user/password; takes precedence if present. |
| `ELASTICSEARCH_INDEX_PREFIX` | ➖ | `scientistshield` | Prefix applied to search indices. |

## Available Scripts
| Command | Location | Description |
| ------- | -------- | ----------- |
| `npm run dev` | root | Starts the Express API with nodemon + ts-node/register. |
| `npm run dev --prefix client` | root | Launches Vite dev server with hot module replacement. |
| `npm run build` | root | Builds the client and copies artifacts into `client/dist`. |
| `npm start` | root | Starts Express in production mode serving the built client. |
| `npm test` | root | Runs backend unit/integration tests using Node's native test runner. |

Run commands from the repository root unless otherwise noted.

## API Highlights
- **Content**: `/api/post`, `/api/tutorial`, `/api/problems`, `/api/pages`
- **Auth**: `/api/auth` (signup/signin), `/api/user`
- **Search**: `/api/search` (automatically falls back when Elasticsearch is disabled)
- **Code execution** (`POST { code: string }`):
  - `/api/code/run-js` – Restricted VM sandbox for JavaScript
  - `/api/code/run-python` – Requires `python3`/`python` binary
  - `/api/code/run-cpp` – Requires a C/C++ toolchain
  - `/api/code/run-java` – Requires JDK
  - `/api/code/run-csharp` – Prefers .NET SDK but supports dotnet-script/csi/scriptcs

Runtimes are optional. If missing, endpoints respond with friendly guidance instead of throwing.

## Code Runners & Debugger
The in-app code editor features an interactive step-by-step debugger inspired by Thonny that supports Python, C/C++, JavaScript, and Java.

**Usage**
1. Open any editor (Try It page or Interactive Code Block) and click **Debug**.
2. Control execution with Play/Pause (`F5`), Step Into (`F11`), Step Over (`F10`), Step Out (`Shift+F11`), Run to Cursor (`Ctrl/Cmd+F10`), and breakpoint toggles (`F9`, `Shift+F9`).
3. Inspect locals, call stack, heap objects, and stdout from the side panels.

Visual cues highlight the current line (green), next line (red), and breakpoints (pink dots). Python traces run locally while other languages leverage the Python Tutor service; when offline, non-Python visualisations may be unavailable.

## Testing
Run server tests from the project root:

```bash
npm test
```

The suite covers controllers, routes, services, and utilities using Node's built-in test runner.

## Troubleshooting
- **MongoDB connection failures** – Verify `MONGO_URI` and ensure the database is running/accessible.
- **CORS or auth issues in dev** – Confirm `CORS_ORIGIN` matches the Vite URL and the proxy is active.
- **Elasticsearch errors** – Set `ELASTICSEARCH_DISABLED=true` to suppress integration or provide valid credentials.
- **Missing runtimes** – Install the necessary language toolchains or expect graceful error messages from the code execution endpoints.

## Contributing
1. Create a feature branch from `main`.
2. Implement focused changes and include tests where practical.
3. Run `npm test` and confirm all checks pass.
4. Submit a pull request with a clear description and screenshots for UI updates.

---

## Desktop Controls
The desktop now keeps every utility visible so you can rearrange layouts freely—no staged scenes required.

### Window controls
- Focus Mode hides supporting utilities and keeps the primary window front and center. Toggle it from the command palette or with `⌘⌥F` (`Ctrl+Alt+F` on Windows/Linux).
- Mission Control fans out every window for drag-and-drop arrangement. Launch it from the dock or with `⌘↑` (`Ctrl+Up` on Windows/Linux).
- Quick Look previews the focused window with Spacebar so you can skim content without moving focus.
- Hot corners trigger Quick Look, Mission Control, and Focus Mode; flick the pointer into a corner to fire the mapped action.
- The wallpaper shifts automatically with the time of day, blending light and dark themes with macOS-style gradients.

### Persistence & data keys
Window positions, focus mode, hot corners, and scratchpad content still persist via `localStorage`:

```
scientistshield.desktop.windowState.v2    // Window positions, sizes, z-index, focus memory
scientistshield.desktop.hotCorners.v1     // Enabled state and per-corner actions
scientistshield.desktop.scratchpad        // Scratchpad text content
```

Clear those keys when you need a clean slate during development or QA.

---

## WhiteSur Theme
The client UI adopts a WhiteSur (macOS Big Sur) inspired theme featuring frosted glass surfaces, rounded corners, and a signature blue accent (`#0A84FF`).

- Icons live under `client/public/icons/whitesur`. Switch packs at runtime:
  - `localStorage.setItem('iconPack', 'whitesur'); location.reload();`
  - Reset with `localStorage.removeItem('iconPack'); location.reload();`
- The header features macOS-style window controls. Glass surfaces use the `glass-effect` utility to adapt across light/dark modes.
- The PWA manifest `theme_color` matches the accent color for cohesive installations.
- Dock controls launch Mission Control, focus mode, and other utilities so everything stays within reach.

---

Versions: ScientistShield_0.1 · ScientistShield0.2 · ScientistShield1.0 · ScientistShield2.0
# finaldock2
