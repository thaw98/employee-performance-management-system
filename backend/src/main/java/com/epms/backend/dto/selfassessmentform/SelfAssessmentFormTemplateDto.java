package com.epms.backend.dto.selfassessmentform;

import java.time.Instant;
import java.util.List;

public record SelfAssessmentFormTemplateDto(
        Long id,
        String title,
        Long departmentId,
        String departmentName,
        Long positionId,
        String positionName,
        boolean isActive,
        List<QuestionDto> questions,
        Integer latestVersionNumber,
        Instant createdOn,
        Long createdBy
) {}