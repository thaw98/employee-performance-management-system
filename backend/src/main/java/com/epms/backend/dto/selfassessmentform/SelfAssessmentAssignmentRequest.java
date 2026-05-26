package com.epms.backend.dto.selfassessmentform;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record SelfAssessmentAssignmentRequest(
        @NotBlank String assignmentMode,
        List<Long> departmentIds,
        List<Long> positionIds,
        List<Long> employeeIds,
        @NotNull LocalDate startDate,
        @NotNull LocalDate deadlineDate,
        @NotNull LocalDate managerReviewDeadlineDate,
        String timelineMode,
        Long reviewCycleId,
        LocalDate manualStartDate,
        LocalDate manualEndDate
) {
}
