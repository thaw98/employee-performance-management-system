package com.epms.backend.dto.selfassessmentform;

import java.time.Instant;

public record QuestionDto(
        Long id,
        String questionText,
        Integer sortOrder,
        Long createdBy,
        Long createdByRoleId,
        boolean isManagerAdded,
        boolean canEdit,
        boolean canDeactivate,
        boolean canHighlight,
        Instant createdOn,
        Instant deletedAt,
        Long deletedBy
) {}
