package com.pokertrainer.backend.controller;

import com.pokertrainer.backend.dto.MatchStartResponse;
import com.pokertrainer.backend.dto.StartMatchRequest;
import com.pokertrainer.backend.model.BotStrategy;
import com.pokertrainer.backend.model.MatchRecord;
import com.pokertrainer.backend.service.AppService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/match")
public class MatchController {
    private final AppService appService;

    public MatchController(AppService appService) {
        this.appService = appService;
    }

    @GetMapping("/strategies")
    public List<BotStrategy> listStrategies() {
        return appService.listStrategies();
    }

    @PostMapping("/start")
    public MatchStartResponse startMatch(
        @RequestHeader("Authorization") String authorizationHeader,
        @Valid @RequestBody StartMatchRequest request
    ) {
        return appService.startMatch(authorizationHeader, request);
    }

    @GetMapping("/history")
    public List<MatchRecord> history(@RequestHeader("Authorization") String authorizationHeader) {
        return appService.matchHistory(authorizationHeader);
    }
}
