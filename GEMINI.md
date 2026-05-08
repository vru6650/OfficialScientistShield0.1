# ScientistShield 2.0: Project Context & Guidelines

ScientistShield 2.0 is a sophisticated MERN-based learning workspace designed for developers and students. It integrates tutorials, quizzes, and competitive programming problems with robust multi-language code execution environments.

## Project Overview

- **Purpose:** An educational platform providing an interactive learning environment with real-time code execution, persistent workspaces, and comprehensive study aids.
- **Architecture:**
  - **Backend:** A modular Express.js "monolith" located in `api/`. Logic is organized into domain-specific modules (e.g., `auth`, `code`, `content`, `quiz`) within `api/modules/`.
  - **Frontend (Vite SPA):** A React-based Single Page Application in `client/`, using Redux Toolkit for state management and Vite for fast development.
  - **Frontend (Next.js):** A modern App Router-based Next.js application in `client-next/`, utilizing React Server Components, Zustand for state, and Tailwind v4.
- **Key Technologies:**
  - **Backend:** Node.js, Express, Mongoose (MongoDB), `pg` (PostgreSQL), Elasticsearch (optional), Zod (validation), Helmet (security).
  - **Frontend:** React, Next.js, Vite, Tailwind CSS (v3/v4), shadcn/ui, Redux Toolkit, Zustand.
  - **Code Execution:** Custom runners for JS, Python, C/C++, Java, and C# with Docker-based isolation in production.

## Building and Running

### Development

Start the API and your choice of frontend separately:

```bash
# Start Express API (Port 3000)
npm run dev

# Start Vite SPA (Port 5173, proxies /api to 3000)
npm run dev --prefix client

# Start Next.js App (Port 3001)
npm run dev:next
```

### Production

```bash
# Build the project (reinstalls dependencies and builds Vite SPA)
npm run build

# Start the API and serve the built Vite SPA
npm start
```

### Testing

Run backend tests using Node's native test runner:

```bash
npm test
```

## Project Structure

- `api/`: Express.js backend source code.
  - `app/`: Application bootstrap, middleware, and route registration.
  - `config/`: Configuration management (e.g., environment variables with Zod).
  - `modules/`: Domain-specific business logic, controllers, and services.
  - `models/`: Mongoose schemas and models.
  - `routes/`: Express router definitions (delegated from modules).
- `client/`: React + Vite frontend application.
- `client-next/`: Next.js App Router frontend application.
- `temp/`: Ephemeral workspace for code runners (ignored by git).
- `uploads/`: Directory for uploaded files and testing artifacts.

## Development Conventions

- **Modular Backend:** New features should be implemented as modules in `api/modules/`. Each module typically contains its own routes, controllers, and services.
- **Coding Style:**
  - Use ES modules with **4-space indentation** and single quotes.
  - Follow Prettier formatting before staging changes.
- **Naming Conventions:**
  - React components: `PascalCase` (e.g., `CreateProblem.jsx`).
  - API routes: `kebab-case`.
  - Shared helpers: Consolidate in `api/services/` or `client/src/utils/`.
- **Tailwind CSS:** Order utilities by layout → spacing → color/state.
- **Environment Variables:** All environment variables must be defined and validated in `api/config/env.js` using Zod.
- **Security:** Follow the established security patterns using Helmet, CSP headers, and rate limiting.
- **Testing:**
  - Keep `*.test.js` beside their modules; use Node’s native test runner.
  - Cover success, validation, authz, and failure paths.
  - Run `npm test` before submitting changes.
- **Frontend State:**
  - Use **Redux Toolkit** for the Vite SPA (`client/`).
  - Use **Zustand** for the Next.js app (`client-next/`).
- **Styling:**
  - `client/`: Tailwind CSS v3.
  - `client-next/`: Tailwind CSS v4 with shadcn/ui.

## Commit Guidelines

- Follow **conventional commits** (e.g., `feat:`, `fix:`, `chore:`) with subjects ≤ 72 characters.
- Ensure commit messages explain impact and intent.
- PRs should summarize scope, impacted areas, and confirm successful local testing (`npm test`, `npm run dev`).

## Code Runners

- **Dev Mode:** Runners attempt to use local toolchains (e.g., `python3`, `g++`, `java`).
- **Production Mode:** Runners use Docker containers for isolation. Configure images and resource limits via `CODE_RUNNER_*` environment variables.
- **Scratch Space:** The `temp/` directory is used for temporary files during execution. It is cleaned up after each run but should be periodically purged in production.
