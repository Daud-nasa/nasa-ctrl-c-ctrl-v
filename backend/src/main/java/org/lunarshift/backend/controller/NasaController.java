package org.lunarshift.backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.LocalDate;
import org.lunarshift.backend.service.NasaDonkiService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/nasa")
public class NasaController {
  private final NasaDonkiService nasaDonkiService;

  public NasaController(NasaDonkiService nasaDonkiService) {
    this.nasaDonkiService = nasaDonkiService;
  }

  @GetMapping("/solar-particle-events")
  public JsonNode getSolarParticleEvents(
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
    return nasaDonkiService.getSolarEnergeticParticleEvents(startDate, endDate);
  }
}
