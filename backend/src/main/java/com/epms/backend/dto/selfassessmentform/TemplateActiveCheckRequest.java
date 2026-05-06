package com.epms.backend.dto.selfassessmentform;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record TemplateActiveCheckRequest(
        @NotNull Long reviewCycleId,
        @NotEmpty @Valid List<TemplateTargetPairRequest> targets
) {}
