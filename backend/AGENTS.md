# Backend Guidelines

## Purpose and Boundaries

This directory is a standalone Java 21 / Spring Boot scaffold for possible future server-side features in Lunar Shift. The current game is a static Vite application with bundled mission data. It does not call this backend, and the backend does not currently provide mission, gameplay, or persistence APIs.

Keep future server work separate from the browser engine. Do not reimplement game rules in Java or make the frontend depend on this service unless a task explicitly defines that product change. Do not add Docker or deployment configuration without an explicit requirement.

## Structure

The Gradle project uses package root `org.lunarshift.backend` and a layered layout:

```text
backend/
  build.gradle                 Dependencies and Java toolchain
  settings.gradle              Gradle project name
  src/main/java/org/lunarshift/backend/
    LunarShiftBackendApplication.java
    config/                    Spring configuration
    controller/                HTTP adapters
    dto/                       Request and response models
    exception/                 API error handling
    repository/                Persistence adapters, when persistence is approved
    service/                   Backend business logic
  src/main/resources/
    application.properties    Local defaults and actuator health exposure
```

Only add concrete layer classes when a feature needs them. Keep controllers focused on HTTP mapping, put business logic in services, and isolate persistence behind repositories. Avoid adding a database, authentication, or external integrations speculatively.

## Build and Run

Use Java 21 and Gradle 8.14 or later. No Gradle wrapper is included in the scaffold.

- `gradle bootRun` runs the local service from `backend/`.
- `gradle build` compiles and packages the service.
- The Spring Boot Actuator health endpoint is `/actuator/health` on the default port `8080`.

## Conventions and Configuration

- Use Java 21, Spring Boot, four-space Java indentation, descriptive `PascalCase` types, and `camelCase` methods/fields.
- Keep configuration in `src/main/resources/application.properties`; inject secrets through environment variables if a future feature requires them.
- Keep response/request models in `dto/`; do not expose persistence entities directly from controllers.
- Add only dependencies that support an explicitly requested capability. Keep the backend independently buildable and do not couple its build to the root npm scripts.

## Verification

Run `gradle build` from this directory when backend verification is requested and Gradle is available. Add tests only when a task requests them or establishes a test framework; keep them local and deterministic, without live NASA API calls.
