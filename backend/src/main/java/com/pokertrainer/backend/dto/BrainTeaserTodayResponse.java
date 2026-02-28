package com.pokertrainer.backend.dto;

public record BrainTeaserTodayResponse(
    String id,
    String question,
    String hint,
    boolean canSubmit,
    int currentStreak,
    long projectedReward
) {
}
