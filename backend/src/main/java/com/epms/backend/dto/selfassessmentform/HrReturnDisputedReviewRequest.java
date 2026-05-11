package com.epms.backend.dto.selfassessmentform;

import jakarta.validation.constraints.NotBlank;

public record HrReturnDisputedReviewRequest(
        @NotBlank String reason
) {}
