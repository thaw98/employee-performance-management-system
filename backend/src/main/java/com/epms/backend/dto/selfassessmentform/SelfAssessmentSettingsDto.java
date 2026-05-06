package com.epms.backend.dto.selfassessmentform;

public record SelfAssessmentSettingsDto(
        String ratingSystem,
        Integer tenPointYesMinRating,
        boolean ratingSystemEditable,
        String ratingSystemLockReason
) {}
