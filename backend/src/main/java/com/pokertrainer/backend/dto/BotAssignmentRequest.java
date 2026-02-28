package com.pokertrainer.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record BotAssignmentRequest(
    @Min(2) @Max(9) int seat,
    @NotBlank String strategyId
) {
}
