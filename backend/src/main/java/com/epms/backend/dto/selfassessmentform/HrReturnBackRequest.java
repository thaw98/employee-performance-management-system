package com.epms.backend.dto.selfassessmentform;

import jakarta.validation.constraints.NotBlank;

public record HrReturnBackRequest(
        @NotBlank String returnReason,
        String comments
) {}
