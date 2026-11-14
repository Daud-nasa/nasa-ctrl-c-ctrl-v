import lunarSouthPoleData from './lunar-south-pole.json';
import type {
  MissionRadiationEvent,
  MissionScenario,
  MissionScenarioTurn,
} from '../game/types';

function getIllumination(value: string): MissionScenarioTurn['illumination'] {
  if (value === 'sunlight' || value === 'shadow') return value;
  throw new Error(`Unknown illumination value "${value}" in lunar south pole mission.`);
}

function getCrewStatus(value: string): MissionScenario['initialState']['crewStatus'] {
  if (value === 'safe' || value === 'at-risk' || value === 'critical') return value;
  throw new Error(`Unknown crew status "${value}" in lunar south pole mission.`);
}

function getEventType(value: string): MissionRadiationEvent['eventType'] {
  if (value === 'SEP') return value;
  throw new Error(`Unknown radiation event type "${value}" in lunar south pole mission.`);
}

function getBalanceStatus(value: string): MissionScenario['balanceStatus'] {
  if (value === 'draft' || value === 'approved') return value;
  throw new Error(`Unknown balance status "${value}" in lunar south pole mission.`);
}

const lunarSouthPoleScenario = {
  ...lunarSouthPoleData,
  balanceStatus: getBalanceStatus(lunarSouthPoleData.balanceStatus),
  initialState: {
    ...lunarSouthPoleData.initialState,
    crewStatus: getCrewStatus(lunarSouthPoleData.initialState.crewStatus),
  },
  turns: lunarSouthPoleData.turns.map((turn) => ({
    ...turn,
    illumination: getIllumination(turn.illumination),
  })),
  radiationEvents: Object.fromEntries(
    Object.entries(lunarSouthPoleData.radiationEvents).map(([id, event]) => [id, {
      ...event,
      eventType: getEventType(event.eventType),
    }]),
  ),
} satisfies MissionScenario;

for (const turn of lunarSouthPoleScenario.turns) {
  if (!turn.radiationEventId) continue;

  const event = lunarSouthPoleScenario.radiationEvents[turn.radiationEventId];
  if (!event || event.activityId !== turn.radiationEventId) {
    throw new Error(
      `Mission "${lunarSouthPoleScenario.id}" references missing radiation event "${turn.radiationEventId}".`,
    );
  }
}

export { lunarSouthPoleScenario };
