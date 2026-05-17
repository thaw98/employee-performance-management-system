package com.epms.backend.dto.selfassessmentform;

import jakarta.validation.constraints.NotBlank;

public record QuestionRequest(
        Long id,
        @NotBlank String questionText,
        Integer sortOrder
) {}