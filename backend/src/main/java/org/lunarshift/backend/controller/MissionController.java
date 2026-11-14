package org.lunarshift.backend.controller;

import jakarta.validation.Valid;
import java.util.List;
import org.lunarshift.backend.dto.MissionApiModels.ForecastResponse;
import org.lunarshift.backend.dto.MissionApiModels.MissionSummary;
import org.lunarshift.backend.dto.MissionApiModels.TurnResolutionResponse;
import org.lunarshift.backend.dto.MissionScenario;
import org.lunarshift.backend.dto.TurnRequest;
import org.lunarshift.backend.service.MissionCatalogService;
import org.lunarshift.backend.service.MissionEngineService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/missions")
public class MissionController {
  private final MissionCatalogService catalogService;
  private final MissionEngineService engineService;

  public MissionController(MissionCatalogService catalogService, MissionEngineService engineService) {
    this.catalogService = catalogService;
    this.engineService = engineService;
  }

  @GetMapping
  public List<MissionSummary> listMissions() {
    return catalogService.listMissions();
  }

  @GetMapping("/{missionId}")
  public MissionScenario getMission(@PathVariable String missionId) {
    return catalogService.getMission(missionId);
  }

  @PostMapping("/{missionId}/forecast")
  public ForecastResponse forecast(@PathVariable String missionId, @Valid @RequestBody TurnRequest request) {
    MissionScenario mission = catalogService.getMission(missionId);
    return engineService.forecast(mission, request.state(), request.choice());
  }

  @PostMapping("/{missionId}/turns")
  public TurnResolutionResponse resolveTurn(@PathVariable String missionId, @Valid @RequestBody TurnRequest request) {
    MissionScenario mission = catalogService.getMission(missionId);
    return engineService.resolve(mission, request.state(), request.choice());
  }
}
