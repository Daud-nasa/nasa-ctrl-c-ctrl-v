# Lunar Shift Backend

Spring Boot API for mission scenarios, turn forecasts, turn resolution, and NASA DONKI SEP data. The backend owns the game rules. It does not store player progress; the frontend should save the returned state in browser storage and send it with each forecast or turn request.

The bundled mission tracks battery, oxygen, food, harvest, and radiation. Life support replenishes oxygen, sheltering costs energy and pauses greenhouse growth, and success requires the crew to finish safely with enough food and the configured final battery reserve.

## Run locally

Use Java 21:

```sh
./gradlew bootRun
```

Run `./gradlew test` for tests or `./gradlew build` for the complete local build. The Gradle Wrapper pins the build tool version.

Base URL: `http://localhost:8080/api/v1`. The full endpoint contract and example payloads are in [`openapi.yaml`](openapi.yaml).

Quick smoke request for the frontend:

```sh
curl http://localhost:8080/api/v1/missions/lunar-south-pole-01
```

This endpoint and the forecast/turn endpoints below are available as soon as the backend starts; core gameplay does not require the NASA API key.

## Frontend game flow

1. Call `GET /missions` and use the returned `id` to choose a mission.
2. Call `GET /missions/{missionId}`. Render the returned scenario and save its `initialState` in browser storage.
3. For a proposed player choice, call `POST /missions/{missionId}/forecast` with the current state and choice. A forecast with `status: "over-budget"` should disable or explain that choice.
4. Call `POST /missions/{missionId}/turns` with the same state and choice to resolve the turn. On `status: "resolved"`, replace the saved state with the returned state. On `status: "over-budget"`, keep the previous state unchanged.
5. Stop accepting choices when `outcome` is `success` or `failure`; offer replay using the scenario's `initialState`.

To show live space-weather context for a radiation event, call `GET /nasa/solar-particle-events` with the event's UTC date as both `startDate` and `endDate`. This NASA data is briefing context; the scenario's explicit event reference continues to drive the authored turn rules.

Example request:

```json
{
  "state": {
    "turnIndex": 0,
    "batteryCharge": 12,
    "oxygenReserve": 2,
    "foodReserve": 6,
    "cropProgress": 0,
    "harvestTotal": 0,
    "radiationScore": 0,
    "crewStatus": "safe"
  },
  "choice": {
    "powerLifeSupport": true,
    "powerGreenhouse": true,
    "shelterCrew": false
  }
}
```

Send the example to `POST http://localhost:8080/api/v1/missions/lunar-south-pole-01/forecast` to preview a choice, then to `/turns` to resolve it. Both requests take the same JSON body shown above.

## NASA data and local configuration

`GET /api/v1/nasa/solar-particle-events?startDate=2024-05-11&endDate=2024-05-11` proxies NASA DONKI SEP data as a stable DTO with `id`, `eventTime`, `instruments`, `sourceUrl`, and `relatedEventIds`. Set `NASA_API_KEY` in the backend environment. The API key is never sent to the browser. The default CORS allowlist includes `localhost` and `127.0.0.1` on ports 3000, 5173, and 5174; override it with comma-separated `FRONTEND_ALLOWED_ORIGINS` values when needed. NASA service errors return `503` and are not replaced by the archived scenario snapshot.

## Render deployment

The root `render.yaml` keeps the current static frontend service and adds a Docker-based Java web service. Render builds and tests the backend image with `backend/Dockerfile`, checks `/actuator/health`, and binds Spring Boot to Render's `PORT`. On the first Blueprint sync, provide `NASA_API_KEY` and the deployed frontend URL in `FRONTEND_ALLOWED_ORIGINS`; neither value is committed to the repository.
