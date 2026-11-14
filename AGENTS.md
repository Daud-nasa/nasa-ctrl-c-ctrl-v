# Repository Guidelines

## Project Overview

Lunar Shift is a short browser mission trainer for students ages 10–14. The current MVP is a static Vite and TypeScript app: players manage a lunar south pole outpost for six turns, balancing crew life support, greenhouse growth, battery charge, food, and radiation shelter. The app runs from bundled scenario data and does not need a server or live NASA API calls.

The repository also contains a separate, minimal Spring Boot scaffold in `backend/` for future server-side work. It is not used by the browser game, Vite build, or current Render deployment. Do not add a runtime dependency between these projects without an explicit product decision.

## Project Structure

- `src/main.ts` is the browser entry point; `src/styles.css` contains global styles.
- `src/game/types.ts` defines mission, state, player choice, forecast, and result types; `src/game/engine.ts` contains deterministic turn calculations.
- `src/data/lunar-south-pole.json` is the authored six-turn scenario; `src/data/missions.ts` validates and loads it. `src/data/nasa/` contains archived source data.
- `docs/architecture.md` describes the game architecture and work sequence. `docs/sources.md` records NASA references, data derivation, credits, and game-balance assumptions.
- `backend/` is an independent Java 21 / Spring Boot project. Its local instructions and structure are in `backend/AGENTS.md`.
- `render.yaml` configures the static site deployment. There are currently no Dockerfiles or Docker Compose files.

Keep the source evidence distinct from game design values. NASA materials inform the illumination sequence and provide mission context; solar output, system costs, radiation scores, crop timing, and victory thresholds are scenario-authored game units, not NASA measurements. Preserve source URLs and NASA credits when changing scenario data.

## Development Commands

Use Node.js 22.12+ on the 22.x line or Node.js 24+.

From the repository root:

- `npm ci` installs the locked frontend dependencies.
- `npm run dev` starts the Vite development server.
- `npm run typecheck` runs TypeScript without emitting files.
- `npm run build` type-checks and builds the static site into `dist/`.
- `npm run preview` serves the built site locally.

For the independent backend, use Java 21 and Gradle 8.14 or later. From `backend/`, run `gradle bootRun` to start it and `gradle build` to compile/package it. The backend has no Gradle wrapper in this scaffold and is not required for frontend development or deployment.

There is no configured automated test runner in either project yet. Do not introduce a test framework unless the task calls for it; when one is added, document the command here and in the relevant project instructions.

## Implementation Conventions

### Browser game

- Use TypeScript ES modules, strict typing, two-space indentation, `camelCase` values/functions, and `PascalCase` types.
- Keep game rules in `src/game/`; keep presentation and interaction in UI code. The engine should remain deterministic and independent of the DOM.
- Store mission-specific balance values in scenario data rather than hiding defaults in the engine.
- Use bundled NASA data. Do not make gameplay depend on a live NASA service.
- Keep forecast and resolution behavior aligned: a choice shown as affordable in the preview must resolve with the same energy calculation.

### Backend

- Follow the layered structure documented in `backend/AGENTS.md`: controller, service, repository, DTO, configuration, and exception handling.
- Keep it independent from the static game unless an API or persistence feature is explicitly requested. Do not invent game rules or duplicate the TypeScript engine in Java.
- Keep credentials out of source control. Prefer environment-based configuration if future integrations need secrets.

## Verification

For frontend behavior or type changes, run `npm run typecheck` and `npm run build` when verification is requested or appropriate. For backend changes, run `gradle build` from `backend/` when Gradle is available. There is no live NASA service requirement for local builds.

When a test framework is introduced, prioritize deterministic engine cases for sunlight and shadow, shelter, harvest, over-budget choices, and successful and failed missions. Keep the phone and desktop layouts usable for visible UI changes.

## Contribution and Security

Use a focused branch and concise imperative commit summary. PRs should describe the change and verification; include a screenshot for visible UI changes. Coordinate shared scenario/type changes with dependent work.

Do not commit bot tokens, credentials, or private deployment values. The Telegram integration uses the client SDK; the game must not require a bot token. Do not add Docker or backend deployment infrastructure without an explicit requirement.
