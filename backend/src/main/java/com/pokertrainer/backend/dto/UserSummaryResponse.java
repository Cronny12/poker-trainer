package com.pokertrainer.backend.dto;

public record UserSummaryResponse(
    String id,
    String username,
    String email,
    String displayName,
    String bio,
    long chips,
    int teaserStreak,
    int wins,
    int losses
) {
}
