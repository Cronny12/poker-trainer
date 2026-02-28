package com.pokertrainer.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank @Size(min = 3, max = 24) String username,
    @NotBlank @Email String email,
    @NotBlank @Size(min = 6, max = 64) String password
) {
}
