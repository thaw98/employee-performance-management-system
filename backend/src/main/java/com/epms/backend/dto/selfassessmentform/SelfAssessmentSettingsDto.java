package com.epms.backend.dto.selfassessmentform;

public record SelfAssessmentSettingsDto(
        String ratingSystem,
        Integer tenPointYesMinRating,
        Integer fivePointYesMinRating,
        boolean includeYesNo,
        boolean ratingSystemEditable,
        String ratingSystemLockReason
) {}
