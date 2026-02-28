package com.pokertrainer.backend.controller;

import com.pokertrainer.backend.dto.ProfileResponse;
import com.pokertrainer.backend.dto.UpdateProfileRequest;
import com.pokertrainer.backend.service.AppService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    private final AppService appService;

    public ProfileController(AppService appService) {
        this.appService = appService;
    }

    @GetMapping
    public ProfileResponse profile(@RequestHeader("Authorization") String authorizationHeader) {
        return appService.profile(authorizationHeader);
    }

    @PutMapping
    public ProfileResponse updateProfile(
        @RequestHeader("Authorization") String authorizationHeader,
        @Valid @RequestBody UpdateProfileRequest request
    ) {
        return appService.updateProfile(authorizationHeader, request);
    }
}
