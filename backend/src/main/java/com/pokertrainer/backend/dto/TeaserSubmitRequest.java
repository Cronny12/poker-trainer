package com.pokertrainer.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record TeaserSubmitRequest(@NotBlank String answer) {
}
