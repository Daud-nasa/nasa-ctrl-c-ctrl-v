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
- [Architecture and backend API contract](docs/architecture.md)

## Run locally

Use Node.js 22.12 or later on the 22.x line, or Node.js 24 or later.

```sh
cd frontend
npm ci
npm run dev
```

Open the local URL printed by Vite. `npm run build` checks TypeScript and creates the static site in `frontend/dist/`. Run `npm run preview` after a build to check the production output locally.

The browser client loads the mission scenario and resolves turns through the Java backend. Start the backend in a second terminal:

```sh
cd backend
./gradlew bootRun
```

The frontend defaults to the local API at `http://localhost:8080/api/v1` during development. Player progress stays in browser storage; the backend does not save player data.

## Deploy to Render and open in Telegram

1. In the [Render Dashboard](https://dashboard.render.com/), choose **New → Blueprint**, connect `Daud-nasa/nasa-ctrl-c-ctrl-v` on `main`, and apply [`render.yaml`](render.yaml). It creates the static frontend and Java backend. Set `FRONTEND_ALLOWED_ORIGINS` to the deployed frontend URL; `NASA_API_KEY` is only needed for the live NASA data endpoint.
2. Open the HTTPS `onrender.com` URL from the completed deploy and check that the page loads.
3. In [@BotFather](https://t.me/BotFather), create a bot with `/newbot` or select an existing bot. Run `/setmenubutton`, choose the bot, enter the Render HTTPS URL, and name the button `Play Lunar Shift`.
4. Open the bot on your phone and tap the menu button. To add a direct `https://t.me/<bot_username>?startapp` link, enable **Main Mini App** in the bot's settings in BotFather and set the same URL.

The frontend initializes the Telegram client SDK when opened in Telegram and also runs in a regular browser. The game requires the Java backend; the Telegram bot token is only used to configure the separate chat-reply webhook.

## Enable Telegram chat replies

The bot replies to `/start` and `/help` in private chats. Both replies include a button that opens the existing Render Static Site as a Mini App.

1. In Render, create a separate **Web Service** using this repository and `main`. Select **Node** and the **Free** instance. Leave Root Directory blank. Use `node --check bot/server.mjs` for Build Command and `node bot/server.mjs` for Start Command. Set the Health Check Path to `/health`.
2. Set `NODE_VERSION` to `24.22.1` and add `TELEGRAM_WEBHOOK_SECRET`. Use Render's **Generate** button for the secret, or generate one with `openssl rand -hex 32`. Wait for the service to go live.
3. From the repository root, run `python3 bot/register-webhook.py`. Enter the **bot service** HTTPS URL, the BotFather token, and the same webhook secret. The script registers the webhook with Telegram. The token is entered in your terminal and used only for the Telegram API request.
4. Open a private chat with your bot and send `/start`, then `/help`. Check that **Play Lunar Shift** opens the Mini App. To list the commands in Telegram, use `/setcommands` in BotFather with `start - Open the mission trainer` and `help - Read the mission briefing` on separate lines.

The free bot service can take up to about a minute to wake after inactivity. The Static Site continues serving the Mini App URL.

## Team workflow

Keep `main` playable once the first build lands. Take one task per branch and open a PR into `main`. Review the change before merging when another teammate is available.

- Branch examples `feat/turn-engine`, `feat/mission-data`, `feat/mission-screen`.
- In each PR, include the change, how to verify it, and a screenshot for visible changes.
- Coordinate changes to shared types and mission data in the PR before merging dependent changes.
