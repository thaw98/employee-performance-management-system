package com.epms.backend.dto.appraisal;

import java.time.Instant;
import java.time.LocalDate;

public record AppraisalHistoryDetailRowDto(
        Long assignmentId,
        Long cycleId,
        String cycleName,
        LocalDate cycleStartDate,
        LocalDate cycleEndDate,
        Long departmentId,
        String departmentName,
        Long positionId,
        String positionName,
        Long employeeDbId,
        String employeeId,
        String employeeName,
        String status,
        String statusLabel,
        Double score,
        String ratingCategory,
        Instant submittedDate,
        Instant hrApprovedDate,
        Instant finalizedDate) {
}
