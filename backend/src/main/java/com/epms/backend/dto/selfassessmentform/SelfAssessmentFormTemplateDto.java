package com.epms.backend.dto.selfassessmentform;

import java.time.Instant;
import java.time.LocalDate;
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
        String timelineMode,
        LocalDate manualStartDate,
        LocalDate manualEndDate,
        boolean isActive,
        String ratingSystem,
        Integer tenPointYesMinRating,
        Integer fivePointYesMinRating,
        Integer yesMinRating,
        boolean includeYesNo,
        boolean isLocked,
        boolean isAssignedToDeadline,
        List<QuestionDto> questions,
        List<QuestionDto> deletedQuestions,
        Instant createdOn,
        Long createdBy
) {}
