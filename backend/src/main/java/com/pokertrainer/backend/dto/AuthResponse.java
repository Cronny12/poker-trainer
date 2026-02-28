package com.pokertrainer.backend.dto;

public record AuthResponse(String token, UserSummaryResponse user) {
}
