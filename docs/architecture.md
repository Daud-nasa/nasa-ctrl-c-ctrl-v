# Architecture

## System Overview

Lunar Shift is a mission trainer for students ages 10–14. The project is being rebuilt around a Java 21 / Spring Boot backend. The backend owns mission scenario data and deterministic turn calculations. The frontend is a separate client: it renders the mission, calls the backend API, and saves returned progress in browser storage. The backend currently keeps no player data and does not use a database.

The Java API and scenario under `backend/` own the current game rules. The root Render Blueprint defines a static frontend service and a Docker-based backend Web Service; it requires the NASA API key and frontend origin to be supplied in Render. Spring Boot binds to Render's `PORT` environment variable and uses `8080` locally.

## Repository Map

```text
src/                                  Existing browser client and legacy TS engine
docs/
  architecture.md                     This system overview
  sources.md                          NASA references and game-balance notes
backend/
  build.gradle                        Spring Boot, Java toolchain, dependencies
  Dockerfile                          Multi-stage Java 21 image; runs tests before packaging
  openapi.yaml                        Frontend-facing API contract and examples
  README.md                           Local run instructions and frontend request flow
  src/main/java/org/lunarshift/backend/
    controller/                       Mission and NASA HTTP endpoints
    dto/                              Scenario and API request/response types
    exception/                        Consistent API errors
    service/                          Mission catalog, game engine, NASA DONKI client
  src/main/resources/
    application.properties            API key and local CORS configuration
    missions/lunar-south-pole-01.json  Bundled six-turn scenario
```

## Frontend API Flow

The contract is defined in `backend/openapi.yaml`; the base URL locally is `http://localhost:8080/api/v1`.

1. `GET /missions` returns available mission summaries.
2. `GET /missions/{missionId}` returns scenario data, rules, source metadata, and the initial state.
3. `POST /missions/{missionId}/forecast` accepts `{ state, choice }` and returns available energy, required energy, and `within-budget` or `over-budget`.
4. `POST /missions/{missionId}/turns` accepts the same `{ state, choice }` and returns either `over-budget` as a terminal failure without advancing or `resolved` with the next state, outcome, and reasons.

The frontend saves the returned state in browser storage and includes it in later requests. The backend validates its shape and values but does not authenticate or persist it. A terminal `success` or `failure` outcome ends the current mission; replay starts from the scenario's `initialState`.

## Game Engine

Java engine behavior is deterministic and independent of HTTP and browser code. Forecast and resolution share the same energy calculation. Resolution applies food and oxygen consumption, life-support oxygen production, greenhouse growth and harvest, radiation exposure, and crew thresholds using scenario values. Unpowered life support drains the two-shift oxygen reserve. Shelter costs energy and prevents greenhouse growth that shift. A successful mission must also finish with the scenario's minimum battery reserve.

Scenario balancing values are authored game units. NASA observations provide mission context and selected event references; they are not direct measurements of lunar surface power, radiation dose, or food production.

## NASA Data

`GET /api/v1/nasa/solar-particle-events` proxies the NASA DONKI SEP API through the backend. Configure `NASA_API_KEY` in the backend environment. The key must never be sent to the frontend. Return an explicit service error when a required live NASA request fails; do not silently substitute archived data.

NASA SVS illumination frames are not served by this DONKI endpoint. The bundled scenario records the selected SVS frame URLs, timestamps, and derived illumination labels. Preserve that provenance and credits; the pixel-based sunlight/shadow classification is a game input, not an official NASA surface classification. See `docs/sources.md` for sources and balance notes.

## Local Development

Use Java 21. From `backend/`, run `./gradlew bootRun` to start the API, `./gradlew test` to run deterministic tests, or `./gradlew build` to compile and test. The checked-in wrapper pins Gradle 8.14.7. Tests use bundled fixtures and mocked NASA responses; they do not call live NASA services. Set `FRONTEND_ALLOWED_ORIGINS` to a comma-separated list when the local frontend runs outside the default localhost port `3000`.
