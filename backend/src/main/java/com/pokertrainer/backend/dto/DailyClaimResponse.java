package com.pokertrainer.backend.dto;

public record DailyClaimResponse(boolean claimed, long awarded, long chips, String message) {
}
