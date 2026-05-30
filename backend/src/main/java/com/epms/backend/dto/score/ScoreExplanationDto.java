package com.epms.backend.dto.score;

import java.time.Instant;

public record ScoreExplanationDto(
        Long id,
        String module,
        Integer sortOrder,
        Integer minScore,
        Integer maxScore,
        String title,
        String details,
        Instant createdAt,
        Instant updatedAt,
        Long updatedBy,
        Long updatedByRoleId) {
}
