package com.epms.backend.dto.selfassessmentform;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record HrRejectManagerReviewRequest(
        @NotBlank String rejectionReason,
        @NotNull LocalDate retakeDeadline,
        Long signatureId
) {}