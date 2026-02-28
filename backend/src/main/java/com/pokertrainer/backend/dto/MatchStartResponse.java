package com.pokertrainer.backend.dto;

import java.time.Instant;
import java.util.List;

public record MatchStartResponse(
    boolean userWon,
    String summary,
    Instant playedAt,
    List<String> botStrategies,
    int wins,
    int losses
) {
}
