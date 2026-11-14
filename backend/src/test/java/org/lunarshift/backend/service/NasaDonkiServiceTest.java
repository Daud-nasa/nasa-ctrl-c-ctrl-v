package org.lunarshift.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withException;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.net.SocketTimeoutException;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lunarshift.backend.dto.NasaSepEvent;
import org.lunarshift.backend.exception.InvalidGameRequestException;
import org.lunarshift.backend.exception.NasaApiException;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class NasaDonkiServiceTest {
  private static final String SEP_URL =
      "https://api.nasa.gov/DONKI/SEP?startDate=2024-05-11&endDate=2024-05-11&api_key=test-key";

  private MockRestServiceServer mockServer;
  private NasaDonkiService service;

  @BeforeEach
  void setUp() {
    RestClient.Builder builder = RestClient.builder().baseUrl("https://api.nasa.gov");
    mockServer = MockRestServiceServer.bindTo(builder).build();
    service = new NasaDonkiService(builder.build(), "test-key");
  }

  @Test
  void normalizesSepResponseAndToleratesMissingOptionalFields() {
    String response = """
        [
          {
            "sepID": "2024-05-11T04:07:00-SEP-001",
            "eventTime": "2024-05-11T04:07Z",
            "instruments": [{"displayName": "STEREO A: IMPACT"}],
            "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/30717/-1",
            "linkedEvents": [{"activityID": "2024-05-11T01:10:00-FLR-001"}]
          },
          {
            "sepID": "2024-05-11T02:10:00-SEP-001",
            "eventTime": "2024-05-11T02:10Z"
          }
        ]
        """;
    expectSuccess(response);

    List<NasaSepEvent> events = service.getSolarEnergeticParticleEvents(
        LocalDate.parse("2024-05-11"), LocalDate.parse("2024-05-11"));

    assertEquals(2, events.size());
    assertEquals("2024-05-11T04:07:00-SEP-001", events.get(0).id());
    assertEquals(List.of("STEREO A: IMPACT"), events.get(0).instruments());
    assertEquals("https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/30717/-1", events.get(0).sourceUrl());
    assertEquals(List.of("2024-05-11T01:10:00-FLR-001"), events.get(0).relatedEventIds());
    assertEquals(List.of(), events.get(1).instruments());
    assertEquals(List.of(), events.get(1).relatedEventIds());
    mockServer.verify();
  }

  @Test
  void rejectsMissingApiKeyWithoutMakingARequest() {
    NasaDonkiService unconfiguredService = new NasaDonkiService(RestClient.builder().build(), " ");

    assertThrows(NasaApiException.class, () -> unconfiguredService.getSolarEnergeticParticleEvents(
        LocalDate.parse("2024-05-11"), LocalDate.parse("2024-05-11")));
    mockServer.verify();
  }

  @Test
  void reportsInvalidDateRangeWithoutCallingNasa() {
    assertThrows(InvalidGameRequestException.class, () -> service.getSolarEnergeticParticleEvents(
        LocalDate.parse("2024-05-12"), LocalDate.parse("2024-05-11")));
    mockServer.verify();
  }

  @Test
  void mapsTimeoutToExplicitNasaServiceFailure() {
    mockServer.expect(requestTo(SEP_URL))
        .andExpect(method(HttpMethod.GET))
        .andRespond(withException(new SocketTimeoutException("timeout")));

    assertThrows(NasaApiException.class, () -> service.getSolarEnergeticParticleEvents(
        LocalDate.parse("2024-05-11"), LocalDate.parse("2024-05-11")));
    mockServer.verify();
  }

  @Test
  void mapsRateLimitResponseToExplicitNasaServiceFailure() {
    mockServer.expect(requestTo(SEP_URL))
        .andExpect(method(HttpMethod.GET))
        .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS));

    assertThrows(NasaApiException.class, () -> service.getSolarEnergeticParticleEvents(
        LocalDate.parse("2024-05-11"), LocalDate.parse("2024-05-11")));
    mockServer.verify();
  }

  private void expectSuccess(String response) {
    mockServer.expect(requestTo(SEP_URL))
        .andExpect(method(HttpMethod.GET))
        .andRespond(withSuccess(response, MediaType.APPLICATION_JSON));
  }
}
