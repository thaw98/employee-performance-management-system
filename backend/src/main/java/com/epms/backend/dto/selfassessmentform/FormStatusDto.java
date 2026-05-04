package com.epms.backend.dto.selfassessmentform;

public record FormStatusDto(
        String status,
        boolean isEligible,
        boolean hasActiveTemplate,
        boolean deadlinePassed,
        String message
) {}