package com.epms.backend.dto.selfassessmentform;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CreateTemplateRequest(
        @NotNull Long departmentId,
        @NotNull Long positionId,
        @NotEmpty List<QuestionRequest> questions
) {}