# Repository Guidelines

## Project Overview

Lunar Shift is a short browser mission trainer for students ages 10–14. The existing browser MVP is built with Vite and TypeScript. The project is being rebuilt so the Java backend owns the game rules and API, while a separate frontend handles presentation and stores player progress in browser storage.

The Java 21 / Spring Boot backend in `backend/` provides the mission and turn API. The current Render configuration still targets the existing static frontend; backend deployment is out of scope until requested.

## Project Structure

- `src/main.ts` is the browser entry point; `src/styles.css` contains global styles.
- `src/game/` and `src/data/` contain the existing TypeScript engine and scenario; the backend's Java engine and bundled scenario are authoritative for the rebuilt API.
- `backend/src/main/java/org/lunarshift/backend/` contains the Java API, scenario catalog, and deterministic game engine. `backend/src/main/resources/missions/` contains the server scenario.
- `backend/openapi.yaml` defines the frontend contract; `backend/README.md` shows the local request flow. `src/data/nasa/` contains an archived NASA source snapshot.
- `docs/architecture.md` describes the game architecture and work sequence. `docs/sources.md` records NASA references, data derivation, credits, and game-balance assumptions.
- `backend/` is the Java 21 / Spring Boot API project. Its local instructions are in `backend/AGENTS.md`.
- `render.yaml` configures the static site deployment. There are currently no Dockerfiles or Docker Compose files.

Keep source evidence distinct from game design values. NASA materials inform the illumination sequence and provide mission context; solar output, system costs, radiation scores, crop timing, and victory thresholds are scenario-authored game units, not NASA measurements. Preserve source URLs and NASA credits when changing scenario data.

## NASA API and Data Rules

- Use NASA Open APIs at `https://api.nasa.gov` through the backend for data products they provide, such as DONKI SEP events. For NASA datasets not exposed through those APIs, use the appropriate authoritative NASA source; do not call NASA services directly from browser code.
- Configure the NASA API key through the `NASA_API_KEY` environment variable. Never commit keys or expose them in frontend bundles, logs, or responses.
- Treat NASA API data as source evidence, not as game-balance values. Preserve attribution and source URLs.
- Handle API errors, timeouts, and rate limits explicitly. Do not silently substitute archived snapshots when a required runtime NASA request fails.
- Keep builds and automated tests independent of live NASA availability; use deterministic fixtures or mocked HTTP responses for tests.

## Development Commands

Use Node.js 22.12+ on the 22.x line or Node.js 24+.

From the repository root:

- `npm ci` installs the locked frontend dependencies.
- `npm run dev` starts the Vite development server.
- `npm run typecheck` runs TypeScript without emitting files.
- `npm run build` type-checks and builds the static site into `dist/`.
- `npm run preview` serves the built site locally.

For the backend, use Java 21 and Gradle 8.14 or later. From `backend/`, run `gradle bootRun` to start it and `gradle build` to compile/package it. The backend has no Gradle wrapper.

The backend uses JUnit through Spring Boot Starter Test; run `gradle test` from `backend/`. There is no frontend test runner. Do not introduce a frontend test framework unless the task calls for it.

## Implementation Conventions

### Browser game

- Use TypeScript ES modules, strict typing, two-space indentation, `camelCase` values/functions, and `PascalCase` types.
- The existing TypeScript engine is a legacy reference. New game calculations belong in the Java backend; the frontend handles presentation and sends player choices to the API.
- Store mission-specific balance values in scenario data rather than hiding defaults in the engine.
- Keep NASA API integration and game rules in the backend; frontend code consumes the project's API and renders the returned state.
- Keep forecast and resolution behavior aligned: a choice shown as affordable by the API must resolve with the same energy calculation.

### Backend

- Follow `backend/AGENTS.md` and keep controllers, services, DTOs, configuration, and error handling in their respective layers.
- Keep Java as the sole authority for game calculations. Do not introduce server-side progress storage unless requested; the frontend saves returned state in browser storage.
- Keep credentials out of source control. Prefer environment-based configuration if future integrations need secrets.

## Verification

For frontend behavior or type changes, run `npm run typecheck` and `npm run build` when verification is requested or appropriate. For backend changes, run `gradle build` from `backend/` when Gradle is available. Builds and automated tests must not require a live NASA service.

When a test framework is introduced, prioritize deterministic engine cases for sunlight and shadow, shelter, harvest, over-budget choices, and successful and failed missions. Keep the phone and desktop layouts usable for visible UI changes.

## Contribution and Security

Use a focused branch and concise imperative commit summary. PRs should describe the change and verification; include a screenshot for visible UI changes. Coordinate shared scenario/type changes with dependent work.

Do not commit bot tokens, credentials, or private deployment values. The Telegram integration uses the client SDK; the game must not require a bot token. Do not add Docker or backend deployment infrastructure without an explicit requirement.
