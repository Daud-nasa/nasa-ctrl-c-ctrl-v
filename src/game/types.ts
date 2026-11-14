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
}

export interface PlayerChoice {
  powerLifeSupport: boolean;
  powerGreenhouse: boolean;
  shelterCrew: boolean;
}

interface TurnEnergy {
  availableEnergy: number;
  requiredEnergy: number;
}

export type TurnResult = TurnEnergy & (
  | { status: 'over-budget' }
  | {
      status: 'resolved';
      state: MissionState;
      outcome: 'in-progress' | 'success' | 'failure';
      reasons: string[];
    }
);
