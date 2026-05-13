package com.epms.backend.dto.selfassessmentform;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record SetTemplateDeadlineRequest(
        @NotNull LocalDate startDate,
        @NotNull LocalDate deadlineDate,
        @NotNull LocalDate managerReviewDeadlineDate
) {
}
