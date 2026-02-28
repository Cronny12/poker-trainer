package com.pokertrainer.backend.service;

import com.pokertrainer.backend.dto.AuthResponse;
import com.pokertrainer.backend.dto.BalanceResponse;
import com.pokertrainer.backend.dto.BotAssignmentRequest;
import com.pokertrainer.backend.dto.BrainTeaserTodayResponse;
import com.pokertrainer.backend.dto.DailyClaimResponse;
import com.pokertrainer.backend.dto.LoginRequest;
import com.pokertrainer.backend.dto.MatchStartResponse;
import com.pokertrainer.backend.dto.ProfileResponse;
import com.pokertrainer.backend.dto.RegisterRequest;
import com.pokertrainer.backend.dto.StartMatchRequest;
import com.pokertrainer.backend.dto.TeaserSubmitResponse;
import com.pokertrainer.backend.dto.UpdateProfileRequest;
import com.pokertrainer.backend.dto.UserSummaryResponse;
import com.pokertrainer.backend.model.BotStrategy;
import com.pokertrainer.backend.model.BrainTeaser;
import com.pokertrainer.backend.model.MatchRecord;
import com.pokertrainer.backend.model.UserAccount;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AppService {
    private static final long STARTING_CHIPS = 1_000;
    private static final long DAILY_CLAIM_CHIPS = 300;
    private static final long TEASER_BASE_CHIPS = 200;
    private static final long TEASER_STREAK_MULTIPLIER = 50;

    private final Map<UUID, UserAccount> usersById = new ConcurrentHashMap<>();
    private final Map<String, UUID> emailToUserId = new ConcurrentHashMap<>();
    private final Map<String, UUID> usernameToUserId = new ConcurrentHashMap<>();
    private final Map<String, UUID> sessionTokens = new ConcurrentHashMap<>();

    private final List<BotStrategy> strategies = List.of(
        new BotStrategy("tight-aggressive", "Tight Aggressive", "Disciplined ranges with pressure on late streets.", 4),
        new BotStrategy("loose-aggressive", "Loose Aggressive", "Wide preflop ranges and frequent barrels.", 5),
        new BotStrategy("calling-station", "Calling Station", "Calls often and rarely bluffs.", 2),
        new BotStrategy("nit", "Nit", "Only enters with premium holdings.", 3),
        new BotStrategy("balanced-grinder", "Balanced Grinder", "Steady, balanced, low-variance strategy.", 3),
        new BotStrategy("maniac", "Maniac", "Over-aggressive, high-pressure style.", 4),
        new BotStrategy("tricky-trapper", "Tricky Trapper", "Slowplays value and check-raises draws.", 3),
        new BotStrategy("gto-lite", "GTO Lite", "Approximate equilibrium frequencies.", 5),
        new BotStrategy("passive-recreational", "Passive Recreational", "Limp-heavy and call-first strategy.", 1),
        new BotStrategy("icm-aware", "ICM Aware", "Conservative around stack-risk spots.", 4)
    );

    private final List<BrainTeaser> teasers = List.of(
        new BrainTeaser("t1", "I speak without a mouth and hear without ears. What am I?", "echo", "You can hear me in a canyon."),
        new BrainTeaser("t2", "What 5-letter word becomes shorter when you add two letters to it?", "short", "The answer is literal."),
        new BrainTeaser("t3", "What has many keys but cannot open a single lock?", "piano", "Think music."),
        new BrainTeaser("t4", "The more of this there is, the less you see. What is it?", "darkness", "Nighttime clue."),
        new BrainTeaser("t5", "What goes up but never comes down?", "age", "Everyone has it.")
    );

    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        String normalizedUsername = request.username().trim().toLowerCase();

        if (emailToUserId.containsKey(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        if (usernameToUserId.containsKey(normalizedUsername)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
        }

        UserAccount user = new UserAccount(request.username().trim(), normalizedEmail, hashPassword(request.password()));
        user.setChips(STARTING_CHIPS);

        usersById.put(user.getId(), user);
        emailToUserId.put(normalizedEmail, user.getId());
        usernameToUserId.put(normalizedUsername, user.getId());

        String token = issueToken(user.getId());
        return new AuthResponse(token, toUserSummary(user));
    }

    public AuthResponse login(LoginRequest request) {
        String identifier = request.identifier().trim().toLowerCase();

        UUID userId = Optional.ofNullable(emailToUserId.get(identifier))
            .or(() -> Optional.ofNullable(usernameToUserId.get(identifier)))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        UserAccount user = usersById.get(userId);
        if (user == null || !Objects.equals(user.getPasswordHash(), hashPassword(request.password()))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        String token = issueToken(user.getId());
        return new AuthResponse(token, toUserSummary(user));
    }

    public UserSummaryResponse me(String authorizationHeader) {
        UserAccount user = requireUser(authorizationHeader);
        return toUserSummary(user);
    }

    public BalanceResponse balance(String authorizationHeader) {
        UserAccount user = requireUser(authorizationHeader);
        return new BalanceResponse(user.getChips(), user.getTeaserStreak());
    }

    public DailyClaimResponse claimDaily(String authorizationHeader) {
        UserAccount user = requireUser(authorizationHeader);
        LocalDate today = LocalDate.now();

        if (today.equals(user.getLastDailyClaimDate())) {
            return new DailyClaimResponse(false, 0, user.getChips(), "Daily chips already claimed for today.");
        }

        user.setLastDailyClaimDate(today);
        user.setChips(user.getChips() + DAILY_CLAIM_CHIPS);

        return new DailyClaimResponse(true, DAILY_CLAIM_CHIPS, user.getChips(), "Daily chips claimed.");
    }

    public BrainTeaserTodayResponse todayTeaser(String authorizationHeader) {
        UserAccount user = requireUser(authorizationHeader);
        BrainTeaser teaser = teaserForDate(LocalDate.now());
        LocalDate today = LocalDate.now();

        boolean canSubmit = !today.equals(user.getLastTeaserOutcomeDate());
        long projectedReward = canSubmit ? projectedReward(user, today) : 0;

        return new BrainTeaserTodayResponse(
            teaser.id(),
            teaser.question(),
            teaser.hint(),
            canSubmit,
            user.getTeaserStreak(),
            projectedReward
        );
    }

    public TeaserSubmitResponse submitTeaser(String authorizationHeader, String answer) {
        UserAccount user = requireUser(authorizationHeader);
        LocalDate today = LocalDate.now();

        if (today.equals(user.getLastTeaserOutcomeDate())) {
            return new TeaserSubmitResponse(false, 0, user.getTeaserStreak(), user.getChips(), "You already submitted today's brain teaser.");
        }

        BrainTeaser teaser = teaserForDate(today);
        boolean correct = teaser.answer().equalsIgnoreCase(answer.trim());
        user.setLastTeaserOutcomeDate(today);

        if (!correct) {
            user.setTeaserStreak(0);
            return new TeaserSubmitResponse(false, 0, user.getTeaserStreak(), user.getChips(), "Incorrect answer. Streak reset.");
        }

        if (today.minusDays(1).equals(user.getLastCorrectTeaserDate())) {
            user.setTeaserStreak(user.getTeaserStreak() + 1);
        } else {
            user.setTeaserStreak(1);
        }

        user.setLastCorrectTeaserDate(today);
        long awarded = TEASER_BASE_CHIPS + (long) user.getTeaserStreak() * TEASER_STREAK_MULTIPLIER;
        user.setChips(user.getChips() + awarded);

        return new TeaserSubmitResponse(true, awarded, user.getTeaserStreak(), user.getChips(), "Correct. Streak reward applied.");
    }

    public List<BotStrategy> listStrategies() {
        return strategies;
    }

    public MatchStartResponse startMatch(String authorizationHeader, StartMatchRequest request) {
        UserAccount user = requireUser(authorizationHeader);

        Map<Integer, BotStrategy> seats = new LinkedHashMap<>();
        List<BotAssignmentRequest> assignments = request.botAssignments() == null ? List.of() : request.botAssignments();
        assignments.stream()
            .peek(assignment -> {
                if (seats.containsKey(assignment.seat())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duplicate seat assignment detected");
                }
                seats.put(assignment.seat(), strategyById(assignment.strategyId()));
            })
            .toList();

        if (assignments.size() > 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Max 8 bots are allowed");
        }

        for (int seat = 2; seat <= 9; seat++) {
            if (!seats.containsKey(seat)) {
                seats.put(seat, request.randomizeUnassigned() ? randomStrategy() : strategyById("balanced-grinder"));
            }
        }

        List<BotStrategy> lineup = seats.entrySet().stream()
            .sorted(Comparator.comparingInt(Map.Entry::getKey))
            .map(Map.Entry::getValue)
            .toList();

        double avgDifficulty = lineup.stream().mapToInt(BotStrategy::difficulty).average().orElse(3.0);
        double userWinChance = Math.max(0.2, Math.min(0.8, 0.58 - (avgDifficulty - 3.0) * 0.07));
        boolean userWon = ThreadLocalRandom.current().nextDouble() < userWinChance;

        if (userWon) {
            user.incrementWins();
        } else {
            user.incrementLosses();
        }

        Instant now = Instant.now();
        List<String> strategyNames = lineup.stream().map(BotStrategy::name).toList();
        user.getMatchHistory().add(0, new MatchRecord(now, userWon, strategyNames));

        String summary = userWon
            ? "You beat the bot table. No chips risked, stats updated."
            : "Bots won this round. No chips were deducted.";

        return new MatchStartResponse(userWon, summary, now, strategyNames, user.getWins(), user.getLosses());
    }

    public List<MatchRecord> matchHistory(String authorizationHeader) {
        UserAccount user = requireUser(authorizationHeader);
        return user.getMatchHistory();
    }

    public ProfileResponse profile(String authorizationHeader) {
        UserAccount user = requireUser(authorizationHeader);
        return toProfile(user);
    }

    public ProfileResponse updateProfile(String authorizationHeader, UpdateProfileRequest request) {
        UserAccount user = requireUser(authorizationHeader);
        user.setDisplayName(request.displayName().trim());
        user.setBio(request.bio() == null ? "" : request.bio().trim());
        return toProfile(user);
    }

    private BrainTeaser teaserForDate(LocalDate date) {
        int index = (int) Math.floorMod(date.toEpochDay(), teasers.size());
        return teasers.get(index);
    }

    private long projectedReward(UserAccount user, LocalDate today) {
        int nextStreak = today.minusDays(1).equals(user.getLastCorrectTeaserDate())
            ? user.getTeaserStreak() + 1
            : 1;
        return TEASER_BASE_CHIPS + (long) nextStreak * TEASER_STREAK_MULTIPLIER;
    }

    private BotStrategy strategyById(String id) {
        return strategies.stream()
            .filter(strategy -> strategy.id().equals(id))
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown strategy: " + id));
    }

    private BotStrategy randomStrategy() {
        int index = ThreadLocalRandom.current().nextInt(strategies.size());
        return strategies.get(index);
    }

    private UserAccount requireUser(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing bearer token");
        }

        String token = authorizationHeader.substring("Bearer ".length()).trim();
        UUID userId = sessionTokens.get(token);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session expired or invalid token");
        }

        UserAccount user = usersById.get(userId);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found");
        }

        return user;
    }

    private String issueToken(UUID userId) {
        String token = Base64.getUrlEncoder().withoutPadding()
            .encodeToString((userId + ":" + Instant.now().toEpochMilli() + ":" + ThreadLocalRandom.current().nextLong())
                .getBytes(StandardCharsets.UTF_8));
        sessionTokens.put(token, userId);
        return token;
    }

    private String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(bytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    private UserSummaryResponse toUserSummary(UserAccount user) {
        return new UserSummaryResponse(
            user.getId().toString(),
            user.getUsername(),
            user.getEmail(),
            user.getDisplayName(),
            user.getBio(),
            user.getChips(),
            user.getTeaserStreak(),
            user.getWins(),
            user.getLosses()
        );
    }

    private ProfileResponse toProfile(UserAccount user) {
        return new ProfileResponse(
            user.getUsername(),
            user.getEmail(),
            user.getDisplayName(),
            user.getBio(),
            user.getChips(),
            user.getTeaserStreak(),
            user.getWins(),
            user.getLosses()
        );
    }
}
