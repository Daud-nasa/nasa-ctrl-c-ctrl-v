package org.lunarshift.backend.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@org.springframework.test.context.TestPropertySource(properties = "nasa.api-key=")
class MissionControllerTest {
  @Autowired
  private MockMvc mockMvc;

  @Test
  void listsAndLoadsBundledMission() throws Exception {
    mockMvc.perform(get("/api/v1/missions"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value("lunar-south-pole-01"))
        .andExpect(jsonPath("$[0].turnCount").value(6));

    mockMvc.perform(get("/api/v1/missions/lunar-south-pole-01"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.initialState.crewStatus").value("safe"))
        .andExpect(jsonPath("$.turns[2].radiationEventId").value("2024-05-11T04:07:00-SEP-001"));
  }

  @Test
  void forecastsAndResolvesTurnUsingFrontendPayload() throws Exception {
    String body = """
        {
          "state": {
            "turnIndex": 0,
            "batteryCharge": 12,
            "foodReserve": 6,
            "cropProgress": 0,
            "harvestTotal": 0,
            "radiationScore": 0,
            "crewStatus": "safe"
          },
          "choice": {
            "powerLifeSupport": true,
            "powerGreenhouse": true,
            "shelterCrew": false
          }
        }
        """;

    mockMvc.perform(post("/api/v1/missions/lunar-south-pole-01/forecast")
            .contentType(MediaType.APPLICATION_JSON)
            .content(body))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("within-budget"))
        .andExpect(jsonPath("$.availableEnergy").value(20))
        .andExpect(jsonPath("$.requiredEnergy").value(7));

    mockMvc.perform(post("/api/v1/missions/lunar-south-pole-01/turns")
            .contentType(MediaType.APPLICATION_JSON)
            .content(body))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("resolved"))
        .andExpect(jsonPath("$.state.turnIndex").value(1))
        .andExpect(jsonPath("$.outcome").value("in-progress"));
  }

  @Test
  void returnsStructuredErrorsForUnknownMissionsAndInvalidStates() throws Exception {
    mockMvc.perform(get("/api/v1/missions/missing"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("mission_not_found"));

    mockMvc.perform(post("/api/v1/missions/lunar-south-pole-01/forecast")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"state\":{},\"choice\":{}}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("invalid_request"));
  }

  @Test
  void reportsMissingNasaConfigurationWithoutMakingAnExternalRequest() throws Exception {
    mockMvc.perform(get("/api/v1/nasa/solar-particle-events")
            .param("startDate", "2024-05-11")
            .param("endDate", "2024-05-11"))
        .andExpect(status().isServiceUnavailable())
        .andExpect(jsonPath("$.code").value("nasa_api_unavailable"));
  }
}
