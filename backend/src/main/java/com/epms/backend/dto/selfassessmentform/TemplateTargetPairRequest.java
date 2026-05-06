package com.epms.backend.dto.selfassessmentform;

import jakarta.validation.constraints.NotNull;

public record TemplateTargetPairRequest(
        @NotNull Long departmentId,
        @NotNull Long positionId
) {}
