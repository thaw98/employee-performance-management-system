package com.epms.backend.dto.selfassessmentform;

public record ManagerAdjustmentRequest(
        Long answerId,
        String proposedYesNo,
        Integer proposedRating,
        String comment
) {}