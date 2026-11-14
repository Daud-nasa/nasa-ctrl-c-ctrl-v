export interface MissionTurn {
  illumination: 'sunlight' | 'shadow';
  illuminationSourceUrl: string;
  radiationEventId?: string;
}

export interface MissionState {
  turnIndex: number;
  batteryCharge: number;
  foodReserve: number;
  cropProgress: number;
  harvestTotal: number;
  radiationScore: number;
  crewStatus: 'safe' | 'at-risk' | 'critical';
}

export interface Mission {
  initialState: MissionState;
  turns: MissionTurn[];
  batteryCapacity: number;
  sunlightPower: number;
  lifeSupportCost: number;
  greenhouseCost: number;
  harvestTarget: number;
  rules: MissionRules;
}

/** Scenario-authored values for consequences that need game balancing. */
export interface MissionRules {
  foodConsumptionPerTurn: number;
  cropGrowthPerGreenhouseTurn: number;
  harvestThreshold: number;
  harvestYield: number;
  foodPerHarvest: number;
  radiationExposurePerEvent: number;
  shelteredRadiationExposurePerEvent: number;
  crewAtRiskRadiation: number;
  crewCriticalRadiation: number;
}

export interface PlayerChoice {
  powerLifeSupport: boolean;
  powerGreenhouse: boolean;
  shelterCrew: boolean;
}

export interface TurnEnergy {
  availableEnergy: number;
  requiredEnergy: number;
}

export type TurnForecast = TurnEnergy & {
  status: 'within-budget' | 'over-budget';
};

export type TurnResult = TurnEnergy & (
  | { status: 'over-budget' }
  | {
      status: 'resolved';
      state: MissionState;
      outcome: 'in-progress' | 'success' | 'failure';
      reasons: string[];
    }
);
