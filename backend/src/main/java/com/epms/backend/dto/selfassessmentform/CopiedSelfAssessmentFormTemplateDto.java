package com.epms.backend.dto.selfassessmentform;

import java.time.Instant;
import java.util.List;

public record CopiedSelfAssessmentFormTemplateDto(
        Long id,
        Long sourceTemplateId,
        String title,
        String ratingSystem,
        Integer tenPointYesMinRating,
        Long departmentId,
        Long positionId,
        String departmentName,
        String positionName,
        List<QuestionDto> questions,
        List<QuestionDto> deletedQuestions,
        Instant createdOn,
        Long createdBy
) {}
