export interface MissionTurn {
  illumination: 'sunlight' | 'shadow';
  illuminationSourceUrl: string;
  illuminationFrameNumber?: number;
  illuminationAtUtc?: string;
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

export interface MissionScenarioTurn extends MissionTurn {
  illuminationFrameNumber: number;
  illuminationAtUtc: string;
}

export interface MissionRadiationEvent {
  activityId: string;
  eventType: 'SEP';
  observedAtUtc: string;
  observatory: string;
  instrument: string;
  sourceUrl: string;
}

export interface MissionScenario extends Mission {
  id: string;
  title: string;
  briefing: string;
  balanceStatus: 'draft' | 'approved';
  turns: MissionScenarioTurn[];
  illuminationSource: {
    sourceUrl: string;
    visualizationYear: number;
    fieldOfView: string;
    selectedPoint: {
      description: string;
      frameWidth: number;
      frameHeight: number;
      x: number;
      y: number;
      litPixelThreshold: number;
    };
    credits: string[];
  };
  radiationEvents: Record<string, MissionRadiationEvent>;
  balanceNotes: string[];
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
