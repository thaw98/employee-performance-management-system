package com.epms.backend.dto.scoreformula;

import java.time.Instant;

public record ScoreFormulaDto(
        Long id,
        String name,
        String area,
        boolean active,
        boolean isDefault,
        String definition,
        String description,
        Long createdBy,
        Instant createdAt,
        Long updatedBy,
        Instant updatedAt,
        Long inactivatedBy,
        Instant inactivatedAt
) {}
