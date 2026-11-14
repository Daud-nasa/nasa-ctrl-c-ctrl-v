/**
 * Public UI integration contract. The separate frontend passes the loaded
 * mission, current state, and player choice to these pure engine functions.
 * Call forecastTurn for the preview and resolveTurn to apply the same choice.
 */
import type {
  Mission,
  MissionState,
  PlayerChoice,
  TurnForecast,
  TurnResult,
} from './types';

function getTurn(mission: Mission, state: MissionState) {
  const turn = mission.turns[state.turnIndex];
  if (!turn) {
    throw new RangeError(`No mission turn exists at index ${state.turnIndex}.`);
  }
  return turn;
}

function getEnergy(mission: Mission, state: MissionState, choice: PlayerChoice) {
  const turn = getTurn(mission, state);
  const solarGeneration = turn.illumination === 'sunlight' ? mission.sunlightPower : 0;
  const availableEnergy = solarGeneration + state.batteryCharge;
  const requiredEnergy =
    (choice.powerLifeSupport ? mission.lifeSupportCost : 0) +
    (choice.powerGreenhouse ? mission.greenhouseCost : 0);

  return { availableEnergy, requiredEnergy };
}

/** Preview the selected systems' energy budget without changing mission state. */
export function forecastTurn(
  mission: Mission,
  state: MissionState,
  choice: PlayerChoice,
): TurnForecast {
  const { availableEnergy, requiredEnergy } = getEnergy(mission, state, choice);
  return {
    availableEnergy,
    requiredEnergy,
    status: requiredEnergy <= availableEnergy ? 'within-budget' : 'over-budget',
  };
}

/**
 * Apply a valid choice and return a new state. Forecast and resolution share
 * the same energy calculation, so the preview cannot disagree with resolution.
 */
export function resolveTurn(
  mission: Mission,
  state: MissionState,
  choice: PlayerChoice,
): TurnResult {
  const turn = getTurn(mission, state);
  const { availableEnergy, requiredEnergy } = getEnergy(mission, state, choice);
  if (requiredEnergy > availableEnergy) {
    return { status: 'over-budget', availableEnergy, requiredEnergy };
  }

  const reasons: string[] = [];
  const rules = mission.rules;
  let foodReserve = Math.max(0, state.foodReserve - rules.foodConsumptionPerTurn);
  if (rules.foodConsumptionPerTurn > 0) {
    reasons.push(`Food reserve decreased by ${rules.foodConsumptionPerTurn}.`);
  }

  let cropProgress = state.cropProgress;
  let harvestTotal = state.harvestTotal;
  if (choice.powerGreenhouse) {
    cropProgress += rules.cropGrowthPerGreenhouseTurn;
    reasons.push(`Greenhouse added ${rules.cropGrowthPerGreenhouseTurn} crop progress.`);

    if (rules.harvestThreshold > 0) {
      const harvests = Math.floor(cropProgress / rules.harvestThreshold);
      if (harvests > 0) {
        const yieldTotal = harvests * rules.harvestYield;
        const foodTotal = harvests * rules.foodPerHarvest;
        cropProgress -= harvests * rules.harvestThreshold;
        harvestTotal += yieldTotal;
        foodReserve += foodTotal;
        reasons.push(`Harvested ${yieldTotal}; food reserve increased by ${foodTotal}.`);
      }
    }
  }

  let radiationScore = state.radiationScore;
  if (turn.radiationEventId) {
    const exposure = choice.shelterCrew
      ? rules.shelteredRadiationExposurePerEvent
      : rules.radiationExposurePerEvent;
    radiationScore += exposure;
    reasons.push(
      choice.shelterCrew
        ? `Crew sheltered during the radiation event; radiation increased by ${exposure}.`
        : `Crew remained exposed during the radiation event; radiation increased by ${exposure}.`,
    );
  } else if (choice.shelterCrew) {
    reasons.push('Shelter was not needed because this turn had no radiation event.');
  }

  let crewStatus = state.crewStatus;
  if (radiationScore >= rules.crewCriticalRadiation) {
    crewStatus = 'critical';
  } else if (radiationScore >= rules.crewAtRiskRadiation && crewStatus === 'safe') {
    crewStatus = 'at-risk';
  }
  if (crewStatus !== state.crewStatus) {
    reasons.push(`Crew status changed from ${state.crewStatus} to ${crewStatus} due to accumulated radiation.`);
  }

  const nextState: MissionState = {
    turnIndex: state.turnIndex + 1,
    batteryCharge: Math.min(mission.batteryCapacity, availableEnergy - requiredEnergy),
    foodReserve,
    cropProgress,
    harvestTotal,
    radiationScore,
    crewStatus,
  };

  let outcome: Extract<TurnResult, { status: 'resolved' }>['outcome'] = 'in-progress';
  if (crewStatus === 'critical') {
    outcome = 'failure';
    reasons.push('Mission failed because the crew reached critical status.');
  } else if (foodReserve <= 0) {
    outcome = 'failure';
    reasons.push('Mission failed because the food reserve was depleted.');
  } else if (nextState.turnIndex >= mission.turns.length) {
    if (crewStatus !== 'safe') {
      outcome = 'failure';
      reasons.push('Mission failed because the crew did not finish in safe condition.');
    } else if (harvestTotal < mission.harvestTarget) {
      outcome = 'failure';
      reasons.push(`Mission failed because harvest ${harvestTotal} was below the target ${mission.harvestTarget}.`);
    } else {
      outcome = 'success';
      reasons.push(`Mission succeeded with harvest ${harvestTotal}, meeting the target ${mission.harvestTarget}.`);
    }
  }

  return { status: 'resolved', availableEnergy, requiredEnergy, state: nextState, outcome, reasons };
}
