package com.pokertrainer.backend.controller;

import com.pokertrainer.backend.dto.AuthResponse;
import com.pokertrainer.backend.dto.LoginRequest;
import com.pokertrainer.backend.dto.RegisterRequest;
import com.pokertrainer.backend.dto.UserSummaryResponse;
import com.pokertrainer.backend.service.AppService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AppService appService;

    public AuthController(AppService appService) {
        this.appService = appService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return appService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return appService.login(request);
    }

    @GetMapping("/me")
    public UserSummaryResponse me(@RequestHeader("Authorization") String authorizationHeader) {
        return appService.me(authorizationHeader);
    }
}
