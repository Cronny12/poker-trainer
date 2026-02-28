package com.pokertrainer.backend.controller;

import com.pokertrainer.backend.dto.BrainTeaserTodayResponse;
import com.pokertrainer.backend.dto.TeaserSubmitRequest;
import com.pokertrainer.backend.dto.TeaserSubmitResponse;
import com.pokertrainer.backend.service.AppService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/brain-teaser")
public class BrainTeaserController {
    private final AppService appService;

    public BrainTeaserController(AppService appService) {
        this.appService = appService;
    }

    @GetMapping("/today")
    public BrainTeaserTodayResponse getToday(@RequestHeader("Authorization") String authorizationHeader) {
        return appService.todayTeaser(authorizationHeader);
    }

    @PostMapping("/submit")
    public TeaserSubmitResponse submit(
        @RequestHeader("Authorization") String authorizationHeader,
        @Valid @RequestBody TeaserSubmitRequest request
    ) {
        return appService.submitTeaser(authorizationHeader, request.answer());
    }
}
