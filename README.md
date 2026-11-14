# Lunar Shift

Lunar Shift is a short browser-based mission trainer for students. Players run a lunar south pole outpost for six turns, keeping the crew safe and harvesting food while managing limited power.

[NASA Space Apps 2026 challenge](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/)

## MVP

- One mission with a fixed sequence of sunlight, shadow, and a radiation alert.
- Each turn, the player decides which systems to power and whether to move the crew into shelter.
- A mission debrief explains how the player's decisions affected crew safety and the harvest.

## Repository

- [Architecture and first pull requests](docs/architecture.md)
- [NASA sources and game assumptions](docs/sources.md)

The repository currently contains the project plan. The playable build begins with the simulation and mission data described in the architecture.

## Team workflow

Keep `main` playable once the first build lands. Take one task per branch and open a PR into `main`. Review the change before merging when another teammate is available.

- Branch examples `feat/turn-engine`, `feat/mission-data`, `feat/mission-screen`.
- In each PR, include the change, how to verify it, and a screenshot for visible changes.
- Coordinate changes to shared types and mission data in the PR before merging dependent changes.
