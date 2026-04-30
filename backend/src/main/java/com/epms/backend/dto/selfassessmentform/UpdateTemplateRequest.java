package com.epms.backend.dto.selfassessmentform;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record UpdateTemplateRequest(
        @NotNull Long departmentId,
        @NotNull Long positionId,
        boolean isActive,
        @NotEmpty List<QuestionRequest> questions
) {}