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

## Deploy to Render and open in Telegram

1. In the [Render Dashboard](https://dashboard.render.com/), choose **New → Blueprint**, connect `Daud-nasa/nasa-ctrl-c-ctrl-v` on `main`, and apply [`render.yaml`](render.yaml). It creates a free Static Site. Render builds with `npm ci --include=dev && npm run build`, publishes `dist`, and redeploys on pushes to `main`.
2. Open the HTTPS `onrender.com` URL from the completed deploy and check that the page loads.
3. In [@BotFather](https://t.me/BotFather), create a bot with `/newbot` or select an existing bot. Run `/setmenubutton`, choose the bot, enter the Render HTTPS URL, and name the button `Play Lunar Shift`.
4. Open the bot on your phone and tap the menu button. To add a direct `https://t.me/<bot_username>?startapp` link, enable **Main Mini App** in the bot's settings in BotFather and set the same URL.

The hosted page also opens in a regular browser. The Mini App uses the Telegram client SDK to signal readiness and expand the game view. The app runs with bundled mission data and needs no bot token or backend service.

## Team workflow

Keep `main` playable once the first build lands. Take one task per branch and open a PR into `main`. Review the change before merging when another teammate is available.

- Branch examples `feat/turn-engine`, `feat/mission-data`, `feat/mission-screen`.
- In each PR, include the change, how to verify it, and a screenshot for visible changes.
- Coordinate changes to shared types and mission data in the PR before merging dependent changes.
