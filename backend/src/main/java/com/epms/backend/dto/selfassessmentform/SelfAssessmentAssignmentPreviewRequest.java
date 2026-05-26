package com.epms.backend.dto.selfassessmentform;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record SelfAssessmentAssignmentPreviewRequest(
        @NotEmpty List<@Valid TemplateTargetPairRequest> targets,
        @NotNull LocalDate deadlineDate,
        @NotNull LocalDate managerReviewDeadlineDate,
        String timelineMode,
        Long reviewCycleId,
        LocalDate manualStartDate,
        LocalDate manualEndDate
) {
}
