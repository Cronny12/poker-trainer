package com.pokertrainer.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
    @NotBlank @Size(min = 2, max = 32) String displayName,
    @Size(max = 180) String bio
) {
}
