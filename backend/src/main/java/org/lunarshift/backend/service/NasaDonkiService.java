package org.lunarshift.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.LocalDate;
import org.lunarshift.backend.exception.InvalidGameRequestException;
import org.lunarshift.backend.exception.NasaApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Service
public class NasaDonkiService {
  private final RestClient nasaRestClient;
  private final String apiKey;

  public NasaDonkiService(RestClient nasaRestClient, @Value("${nasa.api-key:}") String apiKey) {
    this.nasaRestClient = nasaRestClient;
    this.apiKey = apiKey;
  }

  public JsonNode getSolarEnergeticParticleEvents(LocalDate startDate, LocalDate endDate) {
    if (startDate == null || endDate == null || startDate.isAfter(endDate)) {
      throw new InvalidGameRequestException("startDate and endDate must be valid dates, with startDate before or equal to endDate.");
    }
    if (apiKey.isBlank()) {
      throw new NasaApiException("NASA_API_KEY is not configured on the backend.");
    }

    try {
      JsonNode response = nasaRestClient.get()
          .uri(uriBuilder -> uriBuilder
              .path("/DONKI/SEP")
              .queryParam("startDate", startDate)
              .queryParam("endDate", endDate)
              .queryParam("api_key", apiKey)
              .build())
          .retrieve()
          .body(JsonNode.class);
      if (response == null) {
        throw new NasaApiException("NASA DONKI returned an empty response.");
      }
      return response;
    } catch (RestClientException exception) {
      throw new NasaApiException("NASA DONKI is unavailable or rejected the request.", exception);
    }
  }
}
