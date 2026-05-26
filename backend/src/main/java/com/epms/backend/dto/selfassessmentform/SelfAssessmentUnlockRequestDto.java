package com.epms.backend.dto.selfassessmentform;

import java.time.Instant;
import java.time.LocalDate;

public record SelfAssessmentUnlockRequestDto(
        Long id,
        Long formId,
        Long employeeId,
        String employeeNumber,
        String employeeName,
        Long requestedByUserId,
        String requestedByName,
        Long resolvedByUserId,
        String resolvedByName,
        String status,
        String reasonCode,
        String reasonText,
        String hrReasonCode,
        String hrReasonText,
        LocalDate unlockDeadline,
        Instant requestedAt,
        Instant resolvedAt,
        String formTitle,
        Long cycleId,
        String cycleName,
        LocalDate managerReviewDeadlineDate
) {}
