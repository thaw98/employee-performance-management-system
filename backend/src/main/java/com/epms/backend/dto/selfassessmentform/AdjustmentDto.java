package com.epms.backend.dto.selfassessmentform;

import java.time.Instant;

public record AdjustmentDto(
        Long id,
        String questionText,
        Integer sortOrder,
        String originalYesNo,
        Integer originalRating,
        String proposedYesNo,
        Integer proposedRating,
        String managerComment,
        String hrDecision,
        String hrRejectionReason,
        Instant adjustedAt,
        Long adjustedBy
) {}