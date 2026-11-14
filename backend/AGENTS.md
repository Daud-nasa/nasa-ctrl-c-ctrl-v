# Backend Guidelines

## Purpose and Structure

The Java 21 / Spring Boot backend owns mission scenarios, gameplay calculations, and the frontend-facing API. Keep controllers focused on HTTP mapping, game rules in services, request/response models in `dto/`, and NASA integrations behind a service/client layer. The frontend owns presentation and browser-side progress storage; do not add server-side saves, authentication, or a database unless requested.

`src/main/resources/missions/` contains bundled scenarios. `openapi.yaml` is the frontend API contract and `README.md` documents local integration. Preserve NASA source URLs and credits. NASA values are evidence and context; game-balance values remain scenario-authored.

## API Behavior

- `GET /api/v1/missions` lists scenarios; `GET /api/v1/missions/{id}` returns the scenario and initial state.
- `POST /api/v1/missions/{id}/forecast` previews energy; `POST /api/v1/missions/{id}/turns` resolves a turn. Both accept the current state and choice from the frontend.
- Forecast and resolution must use the same energy calculation. An over-budget turn must not advance state.
- `GET /api/v1/nasa/solar-particle-events?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` proxies NASA DONKI SEP data. NASA calls stay in the backend; do not expose the API key to the browser.

## Build, Run, and Verify

Use Java 21. The checked-in wrapper pins Gradle 8.14.7. From `backend/`:

- `./gradlew bootRun` starts the API on port `8080`.
- `./gradlew test` runs deterministic engine and MockMvc API tests.
- `./gradlew build` compiles, tests, and packages the service.

Set `NASA_API_KEY` in the environment to use the NASA proxy endpoint. Configure browser development origins with `FRONTEND_ALLOWED_ORIGINS`; the default allows localhost port `3000`.

## Render

The root Blueprint deploys `lunar-shift-backend` from `backend/Dockerfile`, with `/actuator/health` as its health check. On Blueprint setup, configure `NASA_API_KEY` and the deployed frontend URL in `FRONTEND_ALLOWED_ORIGINS`; keep both out of source control.

## Conventions and NASA Data

- Use four-space Java indentation, `PascalCase` types, and `camelCase` methods and fields.
- Keep external HTTP requests out of controllers. Handle timeouts, HTTP errors, and NASA rate limits explicitly; required live NASA responses must not silently fall back to archived snapshots.
- Use `https://api.nasa.gov` for supported data products such as DONKI SEP. For datasets not served by NASA Open APIs, use their authoritative NASA source.
- Keep keys out of source control and logs. Tests must use fixtures or mocked HTTP responses, never depend on live NASA availability.
