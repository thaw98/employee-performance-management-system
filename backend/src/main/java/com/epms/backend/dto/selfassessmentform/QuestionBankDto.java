package com.epms.backend.dto.selfassessmentform;

import java.time.Instant;

public record QuestionBankDto(
        Long id,
        String questionText,
        boolean isActive,
        Long createdBy,
        Instant createdOn,
        Long updatedBy,
        Instant updatedOn
) {}
