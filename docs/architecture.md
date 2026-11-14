# Architecture

The MVP is a static TypeScript web app built with Vite and deployed as static files. It keeps the mission state in memory. Restarting the mission restores the initial state.

## Planned source tree

```text
index.html                 Page entry point
src/
  main.ts                  Load the mission and connect the UI to the engine
  game/
    types.ts               Mission, state, choices and turn result
    engine.ts              Forecast and resolve a turn
  data/
    lunar-south-pole.json  Six turns, initial values and victory conditions
    nasa/
      donki-sep-2024-05-11.json  Archived NASA event metadata
  ui/
    mission-screen.ts      Briefing, current resources and player controls
    debrief.ts             Outcome, consequences and restart
  styles.css
tests/
  engine.test.ts           Deterministic mission and edge case tests
docs/
  architecture.md
  sources.md
```

## Turn contract

- **Mission** stores initial values, battery capacity, system costs, victory conditions, and each turn's illumination. The storm turn references the bundled DONKI event by activity ID. Resolve the reference when loading the scenario and report an authoring error if the event is missing.
- **Mission state** stores the turn index, battery charge, food reserve, crop progress, accumulated radiation, and crew status.
- **Player choice** records whether life support and greenhouse are powered and whether the crew enters shelter.
- **Turn result** contains the new state and the reasons behind resource changes or the mission outcome.

The UI reads the turn briefing, collects a choice, and asks the engine for a forecast. The engine uses the same calculation on confirmation so preview and outcome agree. Available energy comes from panels and the battery. System loads subtract from it and any remaining energy carries over up to battery capacity. If a choice exceeds the energy budget, the UI asks the player to adjust it. The engine advances a valid turn, records consequences, and checks whether the mission has ended.

The mission succeeds after six turns when the crew meets the scenario's safety conditions and reaches the harvest target. Include both a winning route and a losing route in the first engine verification. The solar output, timings for crop growth, and radiation scores use game units.

Bundle the archived event and the chosen illumination values with the static build. The mission can run without a live NASA API request. A turn referencing the SEP event activates the shelter decision. The briefing shows the original observation time, observing instrument, and a link to the NASA catalog. The observation supplies the event metadata. The placement of the alert in the story, radiation score, and shelter effect are game design parameters. Treat the event and the illumination sequence as inputs to a fictional scenario.

## First pull requests

| Branch | Deliverable | Acceptance check |
| --- | --- | --- |
| `main` | TypeScript and Vite configuration, shared game types | TypeScript checks pass. |
| `feat/turn-engine` | Forecast, resolution and outcome | A scripted run covers shadow, shelter, harvest and over-budget input. |
| `feat/mission-data` | Six-turn scenario linked to NASA SVS frames and the archived DONKI event | Each illumination state points to a frame. The DONKI record triggers the alert, the briefing links to its source, and the mission has a winning route. |
| `feat/mission-screen` | Frontend entry point, Telegram SDK initialization, briefing, resource controls, debrief and restart | The frontend builds to `dist`, and a player can complete and replay the mission on phone and desktop. |

Start the engine, data and UI branches from the shell in `main`. Use `src/game/types.ts` as the shared contract. The engine and UI should agree on the forecast and resolution signatures before wiring them together. A first playable build is ready once the real scenario runs through the UI and the debrief explains both a successful and a failed mission.
