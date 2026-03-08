# API Domain Modules

This folder defines the modular-monolith boundaries for the backend.

Each domain keeps its own layers:

- `*.route.js` handles endpoint wiring and validation.
- `*.controller.js` maps HTTP requests to use cases.
- `*.service.js` contains business logic.
- `*.repository.js` isolates persistence logic.

## Current domains

- `auth` - authentication and sign-in providers.
- `user` - user profile and account management.
- `quiz` - quiz authoring, retrieval, and submissions.
- `content` - tutorials, posts, comments, pages, and search query APIs.
- `code` - language runner routes plus queue-worker job endpoints.
- `problem`, `files` - currently routed through legacy adapters and ready for deeper extraction.

`api/modules/index.js` is the central registry used by `api/app/registerApiRoutes.js`.
