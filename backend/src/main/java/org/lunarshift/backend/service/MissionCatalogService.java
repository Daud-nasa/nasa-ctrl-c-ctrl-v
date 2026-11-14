package org.lunarshift.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.InputStream;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.lunarshift.backend.dto.MissionApiModels.MissionSummary;
import org.lunarshift.backend.dto.MissionScenario;
import org.lunarshift.backend.exception.MissionNotFoundException;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

@Service
public class MissionCatalogService {
  private static final String SCENARIO_RESOURCE = "classpath:missions/lunar-south-pole-01.json";

  private final Map<String, MissionScenario> missions;

  public MissionCatalogService(ObjectMapper objectMapper, ResourceLoader resourceLoader) {
    this.missions = loadMissions(objectMapper, resourceLoader);
  }

  public List<MissionSummary> listMissions() {
    return missions.values().stream()
        .sorted(Comparator.comparing(MissionScenario::id))
        .map(mission -> new MissionSummary(
            mission.id(), mission.title(), mission.briefing(), mission.balanceStatus(), mission.turns().size()))
        .toList();
  }

  public MissionScenario getMission(String missionId) {
    MissionScenario mission = missions.get(missionId);
    if (mission == null) {
      throw new MissionNotFoundException(missionId);
    }
    return mission;
  }

  private Map<String, MissionScenario> loadMissions(ObjectMapper objectMapper, ResourceLoader resourceLoader) {
    try {
      Resource resource = resourceLoader.getResource(SCENARIO_RESOURCE);
      try (InputStream inputStream = resource.getInputStream()) {
        MissionScenario scenario = objectMapper.readValue(inputStream, MissionScenario.class);
        validateScenario(scenario);
        return Map.of(scenario.id(), scenario);
      }
    } catch (IOException exception) {
      throw new IllegalStateException("Unable to load mission scenario resource.", exception);
    }
  }

  private void validateScenario(MissionScenario scenario) {
    if (scenario == null || isBlank(scenario.id()) || scenario.initialState() == null
        || scenario.turns() == null || scenario.turns().isEmpty() || scenario.rules() == null
        || scenario.radiationEvents() == null) {
      throw new IllegalStateException("Mission scenario is missing required fields.");
    }
    if (scenario.batteryCapacity() < 0 || scenario.sunlightPower() < 0
        || scenario.lifeSupportCost() < 0 || scenario.greenhouseCost() < 0) {
      throw new IllegalStateException("Mission scenario contains negative energy values.");
    }
    for (MissionScenario.MissionTurn turn : scenario.turns()) {
      if (turn == null || (!"sunlight".equals(turn.illumination()) && !"shadow".equals(turn.illumination()))) {
        throw new IllegalStateException("Mission scenario contains an unknown illumination state.");
      }
      if (turn.radiationEventId() != null) {
        MissionScenario.MissionRadiationEvent event = scenario.radiationEvents().get(turn.radiationEventId());
        if (event == null || !turn.radiationEventId().equals(event.activityId())) {
          throw new IllegalStateException("Mission scenario references a missing radiation event.");
        }
      }
    }
  }

  private boolean isBlank(String value) {
    return value == null || value.isBlank();
  }
}
