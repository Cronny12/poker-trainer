package com.pokertrainer.backend.model;

import java.time.Instant;
import java.util.List;

public class MatchRecord {
    private final Instant playedAt;
    private final boolean userWon;
    private final List<String> botStrategies;

    public MatchRecord(Instant playedAt, boolean userWon, List<String> botStrategies) {
        this.playedAt = playedAt;
        this.userWon = userWon;
        this.botStrategies = botStrategies;
    }

    public Instant getPlayedAt() {
        return playedAt;
    }

    public boolean isUserWon() {
        return userWon;
    }

    public List<String> getBotStrategies() {
        return botStrategies;
    }
}
