package com.pokertrainer.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.util.List;

public record StartMatchRequest(
    @Valid @Size(max = 8) List<BotAssignmentRequest> botAssignments,
    boolean randomizeUnassigned
) {
}
