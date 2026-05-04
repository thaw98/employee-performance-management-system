package com.epms.backend.dto.selfassessmentform;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record SetTemplateDeadlineRequest(
        @NotBlank String title,
        @NotNull LocalDate deadlineDate
) {
}
