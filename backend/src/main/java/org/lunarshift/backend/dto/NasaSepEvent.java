package org.lunarshift.backend.dto;

import java.util.List;

public record NasaSepEvent(
    String id,
    String eventTime,
    List<String> instruments,
    String sourceUrl,
    List<String> relatedEventIds) {}
