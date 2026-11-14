package org.lunarshift.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.lunarshift.backend.dto.MissionApiModels.ForecastResponse;
import org.lunarshift.backend.dto.MissionApiModels.TurnResolutionResponse;
import org.lunarshift.backend.dto.MissionScenario;
import org.lunarshift.backend.dto.MissionScenario.CrewStatus;
import org.lunarshift.backend.dto.PlayerChoice;

class MissionEngineServiceTest {
  private final MissionEngineService engine = new MissionEngineService();

  @Test
  void forecastAndResolutionShareEnergyCalculation() {
    MissionScenario mission = mission(List.of(turn("sunlight", null)), 0);
    MissionScenario.MissionState state = state(0, 12, 6, 0, 0, 0, CrewStatus.SAFE);
    PlayerChoice choice = new PlayerChoice(true, true, false);

    ForecastResponse forecast = engine.forecast(mission, state, choice);
    TurnResolutionResponse resolution = engine.resolve(mission, state, choice);

    assertEquals("within-budget", forecast.status());
    assertEquals(20, forecast.availableEnergy());
    assertEquals(7, forecast.requiredEnergy());
    assertEquals(forecast.availableEnergy(), resolution.availableEnergy());
    assertEquals(forecast.requiredEnergy(), resolution.requiredEnergy());
  }

  @Test
  void shadowCanMakeChoiceOverBudgetWithoutAdvancingState() {
    MissionScenario mission = mission(List.of(turn("shadow", null)), 0);
    MissionScenario.MissionState state = state(0, 2, 6, 0, 0, 0, CrewStatus.SAFE);
    PlayerChoice choice = new PlayerChoice(true, true, false);

    TurnResolutionResponse result = engine.resolve(mission, state, choice);

    assertEquals("over-budget", result.status());
    assertEquals(2, result.availableEnergy());
    assertEquals(7, result.requiredEnergy());
    assertNull(result.state());
  }

  @Test
  void greenhouseHarvestAddsFoodAndHarvestTotal() {
    MissionScenario mission = mission(List.of(turn("sunlight", null)), 1);
    MissionScenario.MissionState state = state(0, 12, 5, 2, 0, 0, CrewStatus.SAFE);

    TurnResolutionResponse result = engine.resolve(mission, state, new PlayerChoice(false, true, false));

    assertEquals("resolved", result.status());
    assertEquals(1, result.state().harvestTotal());
    assertEquals(5, result.state().foodReserve());
    assertEquals(0, result.state().cropProgress());
  }

  @Test
  void shelterPreventsScenarioRadiationExposure() {
    MissionScenario mission = mission(List.of(turn("sunlight", "sep-event")), 0);
    MissionScenario.MissionState state = state(0, 12, 6, 0, 0, 0, CrewStatus.SAFE);

    TurnResolutionResponse sheltered = engine.resolve(mission, state, new PlayerChoice(false, false, true));
    TurnResolutionResponse exposed = engine.resolve(mission, state, new PlayerChoice(false, false, false));

    assertEquals(0, sheltered.state().radiationScore());
    assertEquals(3, exposed.state().radiationScore());
    assertEquals(CrewStatus.CRITICAL, exposed.state().crewStatus());
    assertEquals("failure", exposed.outcome());
  }

  @Test
  void completesSuccessfulAndFailedMissionRoutes() {
    MissionScenario oneTurnMission = mission(List.of(turn("sunlight", null)), 0);
    TurnResolutionResponse success = engine.resolve(
        oneTurnMission,
        state(0, 0, 2, 0, 0, 0, CrewStatus.SAFE),
        new PlayerChoice(false, false, false));
    TurnResolutionResponse failure = engine.resolve(
        oneTurnMission,
        state(0, 0, 1, 0, 0, 0, CrewStatus.SAFE),
        new PlayerChoice(false, false, false));

    assertEquals("success", success.outcome());
    assertEquals("failure", failure.outcome());
  }

  private MissionScenario mission(List<MissionScenario.MissionTurn> turns, int harvestTarget) {
    MissionScenario.MissionRules rules = new MissionScenario.MissionRules(
        1, 1, 3, 1, 1, 3, 0, 1, 3);
    MissionScenario.MissionRadiationEvent event = new MissionScenario.MissionRadiationEvent(
        "sep-event", "SEP", "2024-05-11T04:07:00Z", "STEREO A", "IMPACT", "https://api.nasa.gov");
    return new MissionScenario(
        "test-mission", "Test", "Test scenario", "draft",
        state(0, 12, 6, 0, 0, 0, CrewStatus.SAFE),
        turns, 16, 8, 4, 3, harvestTarget, rules, null,
        Map.of("sep-event", event), List.of());
  }

  private MissionScenario.MissionTurn turn(String illumination, String radiationEventId) {
    return new MissionScenario.MissionTurn(illumination, "source", null, null, radiationEventId);
  }

  private MissionScenario.MissionState state(
      int turnIndex, int battery, int food, int crop, int harvest, int radiation, CrewStatus status) {
    return new MissionScenario.MissionState(turnIndex, battery, food, crop, harvest, radiation, status);
  }
}
