package org.lunarshift.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

public final class MissionApiModels {
  private MissionApiModels() {}

  public record MissionSummary(String id, String title, String briefing, String balanceStatus, int turnCount) {}

  public record ForecastResponse(String status, int availableEnergy, int requiredEnergy) {}

  @JsonInclude(JsonInclude.Include.NON_NULL)
  public record TurnResolutionResponse(
      String status,
      int availableEnergy,
      int requiredEnergy,
      MissionScenario.MissionState state,
      String outcome,
      List<String> reasons) {}
}
