package org.lunarshift.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record TurnRequest(
    @NotNull @Valid MissionScenario.MissionState state,
    @NotNull @Valid PlayerChoice choice) {}
