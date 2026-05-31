package com.epms.backend.dto.selfassessmentform;

public record SelfAssessmentSettingsDto(
        String ratingSystem,
        Integer tenPointYesMinRating,
        Integer fivePointYesMinRating,
        Integer yesMinRating,
        boolean includeYesNo,
        boolean ratingSystemEditable,
        String ratingSystemLockReason
) {}
