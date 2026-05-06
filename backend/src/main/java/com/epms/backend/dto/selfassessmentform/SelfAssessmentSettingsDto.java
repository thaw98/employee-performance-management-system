package com.epms.backend.dto.selfassessmentform;

public record SelfAssessmentSettingsDto(
        String ratingSystem,
        boolean ratingSystemEditable,
        String ratingSystemLockReason
) {}
