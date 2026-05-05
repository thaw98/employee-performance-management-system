package com.epms.backend.dto.selfassessmentform;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CreateTemplateRequest(
        @NotBlank String title,
        @NotNull Long departmentId,
        @NotNull Long positionId,
        @NotEmpty List<QuestionRequest> questions,
        List<QuestionRequest> deletedQuestions,
        /** When null, the active employee-submission cycle is used (existing behavior). */
        Long reviewCycleId,
        String ratingSystem
) {}
