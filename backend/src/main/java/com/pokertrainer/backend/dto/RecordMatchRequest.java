package com.pokertrainer.backend.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record RecordMatchRequest(
    @NotNull Boolean userWon,
    List<String> botStrategies
) {
}
