package org.lunarshift.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.List;
import java.time.LocalDate;
import org.lunarshift.backend.exception.InvalidGameRequestException;
import org.lunarshift.backend.exception.NasaApiException;
import org.lunarshift.backend.dto.NasaSepEvent;
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

  public List<NasaSepEvent> getSolarEnergeticParticleEvents(LocalDate startDate, LocalDate endDate) {
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
      return normalizeEvents(response);
    } catch (RestClientException exception) {
      throw new NasaApiException("NASA DONKI is unavailable or rejected the request.", exception);
    }
  }

  private List<NasaSepEvent> normalizeEvents(JsonNode response) {
    if (!response.isArray()) {
      throw new NasaApiException("NASA DONKI returned an unexpected response format.");
    }

    List<NasaSepEvent> events = new ArrayList<>();
    for (JsonNode event : response) {
      String id = text(event, "sepID");
      String eventTime = text(event, "eventTime");
      if (id == null || eventTime == null) {
        throw new NasaApiException("NASA DONKI returned a SEP event without its identifier or event time.");
      }
      events.add(new NasaSepEvent(
          id,
          eventTime,
          textList(event.path("instruments"), "displayName"),
          text(event, "link"),
          textList(event.path("linkedEvents"), "activityID")));
    }
    return List.copyOf(events);
  }

  private List<String> textList(JsonNode array, String fieldName) {
    if (!array.isArray()) {
      return List.of();
    }
    List<String> values = new ArrayList<>();
    for (JsonNode item : array) {
      String value = text(item, fieldName);
      if (value != null) {
        values.add(value);
      }
    }
    return List.copyOf(values);
  }

  private String text(JsonNode object, String fieldName) {
    JsonNode value = object.path(fieldName);
    return value.isTextual() && !value.asText().isBlank() ? value.asText() : null;
  }
}
