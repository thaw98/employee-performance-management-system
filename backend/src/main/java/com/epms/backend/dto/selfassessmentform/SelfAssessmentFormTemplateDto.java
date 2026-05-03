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
        Long reviewCycleId,
        String reviewCycleName,
        boolean isActive,
        List<QuestionDto> questions,
        List<QuestionDto> deletedQuestions,
        Instant createdOn,
        Long createdBy
) {}