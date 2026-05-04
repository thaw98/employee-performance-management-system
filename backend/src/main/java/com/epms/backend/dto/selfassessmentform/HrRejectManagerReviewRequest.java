package com.epms.backend.dto.selfassessmentform;

import jakarta.validation.constraints.NotBlank;

public record HrRejectManagerReviewRequest(
        @NotBlank String rejectionReason,
        Long signatureId
) {}