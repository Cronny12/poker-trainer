package com.pokertrainer.backend.model;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class UserAccount {
    private final UUID id;
    private final String username;
    private final String email;
    private String passwordHash;
    private String displayName;
    private String bio;
    private long chips;
    private int teaserStreak;
    private LocalDate lastDailyClaimDate;
    private LocalDate lastCorrectTeaserDate;
    private LocalDate lastTeaserOutcomeDate;
    private int wins;
    private int losses;
    private final List<MatchRecord> matchHistory;

    public UserAccount(String username, String email, String passwordHash) {
        this.id = UUID.randomUUID();
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.displayName = username;
        this.bio = "Poker student";
        this.chips = 1_000;
        this.teaserStreak = 0;
        this.wins = 0;
        this.losses = 0;
        this.matchHistory = new ArrayList<>();
    }

    public UUID getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public long getChips() {
        return chips;
    }

    public void setChips(long chips) {
        this.chips = chips;
    }

    public int getTeaserStreak() {
        return teaserStreak;
    }

    public void setTeaserStreak(int teaserStreak) {
        this.teaserStreak = teaserStreak;
    }

    public LocalDate getLastDailyClaimDate() {
        return lastDailyClaimDate;
    }

    public void setLastDailyClaimDate(LocalDate lastDailyClaimDate) {
        this.lastDailyClaimDate = lastDailyClaimDate;
    }

    public LocalDate getLastCorrectTeaserDate() {
        return lastCorrectTeaserDate;
    }

    public void setLastCorrectTeaserDate(LocalDate lastCorrectTeaserDate) {
        this.lastCorrectTeaserDate = lastCorrectTeaserDate;
    }

    public LocalDate getLastTeaserOutcomeDate() {
        return lastTeaserOutcomeDate;
    }

    public void setLastTeaserOutcomeDate(LocalDate lastTeaserOutcomeDate) {
        this.lastTeaserOutcomeDate = lastTeaserOutcomeDate;
    }

    public int getWins() {
        return wins;
    }

    public void incrementWins() {
        this.wins += 1;
    }

    public int getLosses() {
        return losses;
    }

    public void incrementLosses() {
        this.losses += 1;
    }

    public List<MatchRecord> getMatchHistory() {
        return matchHistory;
    }
}
