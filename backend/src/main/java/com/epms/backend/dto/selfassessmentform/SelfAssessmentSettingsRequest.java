package com.epms.backend.dto.selfassessmentform;

import jakarta.validation.constraints.NotBlank;

public record SelfAssessmentSettingsRequest(
        @NotBlank String ratingSystem,
        Integer tenPointYesMinRating,
        Integer fivePointYesMinRating,
        Integer yesMinRating,
        Boolean includeYesNo
) {}
