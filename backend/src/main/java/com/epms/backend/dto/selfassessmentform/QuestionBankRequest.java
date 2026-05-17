package com.epms.backend.dto.selfassessmentform;

import jakarta.validation.constraints.NotBlank;

public record QuestionBankRequest(
        @NotBlank String questionText,
        boolean isActive
) {}
