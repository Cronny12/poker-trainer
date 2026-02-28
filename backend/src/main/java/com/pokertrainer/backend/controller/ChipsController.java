package com.pokertrainer.backend.controller;

import com.pokertrainer.backend.dto.BalanceResponse;
import com.pokertrainer.backend.dto.DailyClaimResponse;
import com.pokertrainer.backend.service.AppService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chips")
public class ChipsController {
    private final AppService appService;

    public ChipsController(AppService appService) {
        this.appService = appService;
    }

    @GetMapping("/balance")
    public BalanceResponse getBalance(@RequestHeader("Authorization") String authorizationHeader) {
        return appService.balance(authorizationHeader);
    }

    @PostMapping("/daily-claim")
    public DailyClaimResponse claimDaily(@RequestHeader("Authorization") String authorizationHeader) {
        return appService.claimDaily(authorizationHeader);
    }
}
