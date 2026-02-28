package com.pokertrainer.backend.dto;

public record TeaserSubmitResponse(
    boolean correct,
    long awarded,
    int streak,
    long chips,
    String message
) {
}
