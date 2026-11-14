# Architecture

## System Overview

Lunar Shift has two independent parts:

1. **Browser game:** a static TypeScript app built with Vite. The planned MVP bundles its mission scenario and NASA source snapshots, keeps the active mission state in browser memory, and can be hosted as static files. It must not require a server or live NASA API calls to play.
2. **Backend scaffold:** a separate Java 21 / Spring Boot project in `backend/`. It currently exposes only Spring Boot Actuator health and is not called by the game or included in the Vite build/deployment. Add gameplay APIs or persistence only when a feature explicitly requires them.

The current frontend engine and scenario data are present, but the player-facing mission screen and debrief still need to be connected. Telegram startup integration is in `src/main.ts`.

## Repository Map

```text
src/
  main.ts                         Browser entry and Telegram WebApp startup
  styles.css                      Global browser styles
  game/
    types.ts                      Mission, state, choice, forecast, and result types
    engine.ts                     Pure forecast and turn resolution functions
  data/
    missions.ts                   Scenario validation and bundled event reference check
    lunar-south-pole.json         Six-turn mission and game-balance values
    nasa/
      donki-sep-2024-05-11.json   Archived NASA DONKI event snapshot
docs/
  architecture.md
  sources.md
backend/
  build.gradle                    Spring Boot / Java toolchain and dependencies
  settings.gradle
  AGENTS.md                       Backend-specific Codex instructions
  src/main/java/org/lunarshift/backend/
    LunarShiftBackendApplication.java
    config/                       Spring configuration
    controller/                   Future HTTP adapters
    dto/                           Future API request/response types
    exception/                     Future API error handling
    repository/                    Future persistence adapters
    service/                       Future server-side business logic
  src/main/resources/
    application.properties        App name and Actuator health exposure
```

The backend package folders are extension points; they do not imply that APIs, storage, authentication, or server-side game logic already exist. See `backend/AGENTS.md` for its commands and conventions. No Docker files or Docker deployment configuration are part of the project.

## Frontend Mission Contract

`src/game/types.ts` defines the shared contract:

- **Mission** includes initial state, turn sequence, battery capacity, solar and system energy values, harvest target, and scenario-authored rules.
- **Mission state** tracks turn index, battery charge, food reserve, crop progress, harvested total, radiation score, and crew status.
- **Player choice** says whether life support and the greenhouse are powered and whether the crew enters shelter.
- **Forecast** reports available and required energy and whether the choice is within budget.
- **Turn result** either rejects an over-budget choice or returns the next state, mission outcome, and explanation strings.

The engine API is `forecastTurn(mission, state, choice)` and `resolveTurn(mission, state, choice)` from `src/game/engine.ts`. Forecasting is read-only; resolution uses the same energy calculation. Available energy is current solar generation plus battery charge. Loads subtract from available energy, and the remainder carries forward up to battery capacity. An over-budget choice does not advance the turn.

`resolveTurn` currently applies food consumption, greenhouse growth and harvest, radiation exposure, crew radiation thresholds, and terminal success/failure checks. It does not yet model life-support failure consequences or make shelter consume the turn's greenhouse opportunity. Those design behaviors must be agreed and implemented in the engine before being presented as game rules in the UI. The engine should remain deterministic and independent of the DOM.

Scenario-specific values belong in `src/data/lunar-south-pole.json`; do not add hidden balance defaults to the engine. `src/data/missions.ts` validates the scenario's string unions and checks that any radiation event reference resolves in the bundled event map.

## NASA Inputs and Game Assumptions

The six-turn sequence samples one fixed image coordinate from NASA SVS 4930 frames. The scenario records the frame URLs, frame numbers, timestamps, chosen point, threshold, and credits. The resulting sunlight/shadow labels are inputs derived for this game, not official NASA surface illumination classifications or a surveyed landing coordinate.

The SEP observation is bundled from NASA DONKI and referenced by activity ID. It supplies event metadata for the briefing. The story timing, radiation score, shelter effect, solar generation, battery behavior, system costs, crop timings, food values, and victory thresholds are game design values. In particular, DONKI's STEREO A observation is not a measurement of dose at the lunar surface. Keep these distinctions clear in UI copy and project materials; see `docs/sources.md` for references and current balance notes.

## Backend Scaffold

The backend uses Gradle, Java 21, and Spring Boot 3.5.0. Its current dependencies are Spring Web and Actuator. The only exposed web management endpoint is `/actuator/health` on the default port `8080`; there is no mission API, database, authentication, or external service integration.

Keep future backend features layered as controller → service → repository, with request/response DTOs separate from persistence models. Do not duplicate the TypeScript game engine in Java. The static game should continue to work independently unless a separately scoped product change introduces a defined API contract.

## Delivery Milestones

| Branch / stage | Status | Deliverable | Acceptance criteria |
| --- | --- | --- | --- |
| `main` | In place | Vite and TypeScript app scaffold, Telegram startup, and static deployment config | A fresh checkout installs dependencies and `npm run build` creates `dist/`. |
| `feat/turn-engine` | In current feature branch | Deterministic forecast, turn resolution, and mission outcome | Cover shadow, shelter, harvest, over-budget input, and successful and failed routes. |
| `feat/mission-data` | In current feature branch | Six-turn scenario based on NASA SVS frames and the archived DONKI event | Every illumination state references a frame; the event reference resolves; a winning route exists. Balance remains marked draft until values are approved. |
| `feat/mission-screen` | Next | Shift briefing, resources and controls, forecast, consequences, debrief, and restart | A player can finish and replay on phone and desktop; NASA sources and game-balance values are clearly identified. |

Before accepting the mission screen, decide and implement what happens when life support is not powered and whether shelter uses the shift's greenhouse opportunity. The engine does not model those consequences yet, so the UI must not imply they already apply. Select a frontend test runner before adding automated tests; then cover the acceptance scenarios in the table with deterministic tests.

The backend remains a standalone scaffold until a future task defines a concrete server-side capability and its API, storage, security, and deployment requirements.
