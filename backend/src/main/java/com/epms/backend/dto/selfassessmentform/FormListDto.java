package com.epms.backend.dto.selfassessmentform;

import java.time.Instant;
import java.time.LocalDate;

public record FormListDto(
        Long id,
        Long templateId,
        String title,
        Long cycleId,
        String cycleName,
        LocalDate startDate,
        LocalDate deadlineDate,
        LocalDate managerReviewDeadlineDate,
        LocalDate finalApprovalDeadlineDate,
        Instant assignedAt,
        Long assignedBy,
        EmployeeInfoDto employee,
        String status,
        Double totalScore,
        String ratingCategory,
        Instant submittedDate,
        LocalDate assessmentDate,
        Instant createdDate
) {}
