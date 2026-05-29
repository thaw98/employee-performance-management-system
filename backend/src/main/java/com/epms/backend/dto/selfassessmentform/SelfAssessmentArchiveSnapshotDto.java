package com.epms.backend.dto.selfassessmentform;

import java.time.Instant;
import java.time.LocalDate;

public record SelfAssessmentArchiveSnapshotDto(
        Long id,
        Long originalFormId,
        Long employeeId,
        String employeeName,
        String employeeStaffNo,
        Long departmentId,
        String departmentName,
        Long positionId,
        String positionName,
        Long templateId,
        String templateTitle,
        Long cycleId,
        String cycleName,
        String archivedStatus,
        String rejectionReason,
        Long hrUserId,
        String hrUserName,
        Instant archivedAt,
        LocalDate retakeDeadline,
        Double totalScore,
        Double managerRevisedTotalScore,
        Double finalApprovedTotalScore,
        String ratingCategory,
        String formSnapshot
) {}
