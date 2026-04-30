package com.epms.backend.dto.selfassessmentform;

import java.time.Instant;

public record QuestionDto(
        Long id,
        String questionText,
        Integer sortOrder,
        Long createdBy,
        Instant createdOn
) {}