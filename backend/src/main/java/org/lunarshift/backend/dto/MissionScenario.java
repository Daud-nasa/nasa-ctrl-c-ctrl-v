package org.lunarshift.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public record MissionScenario(
    String id,
    String title,
    String briefing,
    String balanceStatus,
    MissionState initialState,
    List<MissionTurn> turns,
    int batteryCapacity,
    int sunlightPower,
    int lifeSupportCost,
    int greenhouseCost,
    int harvestTarget,
    MissionRules rules,
    IlluminationSource illuminationSource,
    Map<String, MissionRadiationEvent> radiationEvents,
    List<String> balanceNotes) {

  public record MissionState(
      int turnIndex,
      int batteryCharge,
      int foodReserve,
      int cropProgress,
      int harvestTotal,
      int radiationScore,
      CrewStatus crewStatus) {}

  public enum CrewStatus {
    @JsonProperty("safe") SAFE,
    @JsonProperty("at-risk") AT_RISK,
    @JsonProperty("critical") CRITICAL
  }

  public record MissionTurn(
      String illumination,
      String illuminationSourceUrl,
      Integer illuminationFrameNumber,
      String illuminationAtUtc,
      String radiationEventId) {}

  public record MissionRules(
      int foodConsumptionPerTurn,
      int cropGrowthPerGreenhouseTurn,
      int harvestThreshold,
      int harvestYield,
      int foodPerHarvest,
      int radiationExposurePerEvent,
      int shelteredRadiationExposurePerEvent,
      int crewAtRiskRadiation,
      int crewCriticalRadiation) {}

  public record MissionRadiationEvent(
      String activityId,
      String eventType,
      String observedAtUtc,
      String observatory,
      String instrument,
      String sourceUrl) {}

  public record IlluminationSource(
      String sourceUrl,
      int visualizationYear,
      String fieldOfView,
      SelectedPoint selectedPoint,
      List<String> credits) {}

  public record SelectedPoint(
      String description,
      int frameWidth,
      int frameHeight,
      int x,
      int y,
      int litPixelThreshold) {}
}
