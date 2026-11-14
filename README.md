# Lunar Shift

Lunar Shift is a short browser-based mission trainer for students. Players run a lunar south pole outpost for six turns, keeping the crew safe and harvesting food while managing limited power.

[NASA Space Apps 2026 challenge](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/)

## MVP

- One mission with sunlight and shadow derived from NASA SVS frames and a shelter decision triggered by an archived NASA DONKI solar particle event.
- Each turn, the player decides which systems to power and whether to move the crew into shelter.
- A mission debrief explains how the player's decisions affected crew safety and the harvest.

## Repository

- [Architecture and first pull requests](docs/architecture.md)
- [NASA sources and game assumptions](docs/sources.md)
- [Archived NASA DONKI event selected for the mission](src/data/nasa/donki-sep-2024-05-11.json)

## Run locally

Use Node.js 22.12 or later on the 22.x line, or Node.js 24 or later.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. `npm run build` checks TypeScript and creates the static site in `dist/`. Run `npm run preview` after a build to check the production output locally.

The starter page and shared game types are ready. The first playable build begins with the simulation, mission data, and interface described in the architecture.

## Team workflow

Keep `main` playable once the first build lands. Take one task per branch and open a PR into `main`. Review the change before merging when another teammate is available.

- Branch examples `feat/turn-engine`, `feat/mission-data`, `feat/mission-screen`.
- In each PR, include the change, how to verify it, and a screenshot for visible changes.
- Coordinate changes to shared types and mission data in the PR before merging dependent changes.
