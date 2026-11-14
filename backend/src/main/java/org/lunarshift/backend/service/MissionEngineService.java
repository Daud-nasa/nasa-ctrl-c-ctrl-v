package org.lunarshift.backend.service;

import java.util.ArrayList;
import java.util.List;
import org.lunarshift.backend.dto.MissionApiModels.ForecastResponse;
import org.lunarshift.backend.dto.MissionApiModels.TurnResolutionResponse;
import org.lunarshift.backend.dto.MissionScenario;
import org.lunarshift.backend.dto.PlayerChoice;
import org.lunarshift.backend.exception.InvalidGameRequestException;
import org.springframework.stereotype.Service;

@Service
public class MissionEngineService {
  public ForecastResponse forecast(MissionScenario mission, MissionScenario.MissionState state, PlayerChoice choice) {
    validate(mission, state, choice);
    Energy energy = calculateEnergy(mission, state, choice);
    return new ForecastResponse(
        energy.requiredEnergy() <= energy.availableEnergy() ? "within-budget" : "over-budget",
        energy.availableEnergy(), energy.requiredEnergy());
  }

  public TurnResolutionResponse resolve(MissionScenario mission, MissionScenario.MissionState state, PlayerChoice choice) {
    validate(mission, state, choice);
    MissionScenario.MissionTurn turn = mission.turns().get(state.turnIndex());
    Energy energy = calculateEnergy(mission, state, choice);
    if (energy.requiredEnergy() > energy.availableEnergy()) {
      return new TurnResolutionResponse("over-budget", energy.availableEnergy(), energy.requiredEnergy(), null, null, null);
    }

    MissionScenario.MissionRules rules = mission.rules();
    List<String> reasons = new ArrayList<>();
    int foodReserve = Math.max(0, state.foodReserve() - rules.foodConsumptionPerTurn());
    if (rules.foodConsumptionPerTurn() > 0) {
      reasons.add("Food reserve decreased by " + rules.foodConsumptionPerTurn() + ".");
    }

    int cropProgress = state.cropProgress();
    int harvestTotal = state.harvestTotal();
    if (choice.powerGreenhouse()) {
      cropProgress += rules.cropGrowthPerGreenhouseTurn();
      reasons.add("Greenhouse added " + rules.cropGrowthPerGreenhouseTurn() + " crop progress.");
      if (rules.harvestThreshold() > 0) {
        int harvests = cropProgress / rules.harvestThreshold();
        if (harvests > 0) {
          int yieldTotal = harvests * rules.harvestYield();
          int foodTotal = harvests * rules.foodPerHarvest();
          cropProgress -= harvests * rules.harvestThreshold();
          harvestTotal += yieldTotal;
          foodReserve += foodTotal;
          reasons.add("Harvested " + yieldTotal + "; food reserve increased by " + foodTotal + ".");
        }
      }
    }

    int radiationScore = state.radiationScore();
    if (turn.radiationEventId() != null) {
      int exposure = choice.shelterCrew()
          ? rules.shelteredRadiationExposurePerEvent()
          : rules.radiationExposurePerEvent();
      radiationScore += exposure;
      reasons.add(choice.shelterCrew()
          ? "Crew sheltered during the radiation event; radiation increased by " + exposure + "."
          : "Crew remained exposed during the radiation event; radiation increased by " + exposure + ".");
    } else if (choice.shelterCrew()) {
      reasons.add("Shelter was not needed because this turn had no radiation event.");
    }

    MissionScenario.CrewStatus crewStatus = state.crewStatus();
    if (radiationScore >= rules.crewCriticalRadiation()) {
      crewStatus = MissionScenario.CrewStatus.CRITICAL;
    } else if (radiationScore >= rules.crewAtRiskRadiation() && crewStatus == MissionScenario.CrewStatus.SAFE) {
      crewStatus = MissionScenario.CrewStatus.AT_RISK;
    }
    if (crewStatus != state.crewStatus()) {
      reasons.add("Crew status changed from " + jsonCrewStatus(state.crewStatus()) + " to "
          + jsonCrewStatus(crewStatus) + " due to accumulated radiation.");
    }

    MissionScenario.MissionState nextState = new MissionScenario.MissionState(
        state.turnIndex() + 1,
        Math.min(mission.batteryCapacity(), energy.availableEnergy() - energy.requiredEnergy()),
        foodReserve,
        cropProgress,
        harvestTotal,
        radiationScore,
        crewStatus);

    String outcome = "in-progress";
    if (crewStatus == MissionScenario.CrewStatus.CRITICAL) {
      outcome = "failure";
      reasons.add("Mission failed because the crew reached critical status.");
    } else if (foodReserve <= 0) {
      outcome = "failure";
      reasons.add("Mission failed because the food reserve was depleted.");
    } else if (nextState.turnIndex() >= mission.turns().size()) {
      if (crewStatus != MissionScenario.CrewStatus.SAFE) {
        outcome = "failure";
        reasons.add("Mission failed because the crew did not finish in safe condition.");
      } else if (harvestTotal < mission.harvestTarget()) {
        outcome = "failure";
        reasons.add("Mission failed because harvest " + harvestTotal + " was below the target " + mission.harvestTarget() + ".");
      } else {
        outcome = "success";
        reasons.add("Mission succeeded with harvest " + harvestTotal + ", meeting the target " + mission.harvestTarget() + ".");
      }
    }

    return new TurnResolutionResponse("resolved", energy.availableEnergy(), energy.requiredEnergy(), nextState, outcome, reasons);
  }

  private Energy calculateEnergy(MissionScenario mission, MissionScenario.MissionState state, PlayerChoice choice) {
    MissionScenario.MissionTurn turn = mission.turns().get(state.turnIndex());
    int solarGeneration = "sunlight".equals(turn.illumination()) ? mission.sunlightPower() : 0;
    int availableEnergy = solarGeneration + state.batteryCharge();
    int requiredEnergy = (choice.powerLifeSupport() ? mission.lifeSupportCost() : 0)
        + (choice.powerGreenhouse() ? mission.greenhouseCost() : 0);
    return new Energy(availableEnergy, requiredEnergy);
  }

  private void validate(MissionScenario mission, MissionScenario.MissionState state, PlayerChoice choice) {
    if (state == null || choice == null) {
      throw new InvalidGameRequestException("State and choice are required.");
    }
    if (choice.powerLifeSupport() == null || choice.powerGreenhouse() == null || choice.shelterCrew() == null) {
      throw new InvalidGameRequestException("All player choice fields are required.");
    }
    if (state.turnIndex() < 0 || state.turnIndex() >= mission.turns().size()) {
      throw new InvalidGameRequestException("Turn index is outside the mission.");
    }
    if (state.batteryCharge() < 0 || state.batteryCharge() > mission.batteryCapacity()
        || state.foodReserve() < 0 || state.cropProgress() < 0 || state.harvestTotal() < 0
        || state.radiationScore() < 0 || state.crewStatus() == null) {
      throw new InvalidGameRequestException("Mission state contains invalid resource values.");
    }
  }

  private String jsonCrewStatus(MissionScenario.CrewStatus status) {
    return switch (status) {
      case SAFE -> "safe";
      case AT_RISK -> "at-risk";
      case CRITICAL -> "critical";
    };
  }

  private record Energy(int availableEnergy, int requiredEnergy) {}
}
