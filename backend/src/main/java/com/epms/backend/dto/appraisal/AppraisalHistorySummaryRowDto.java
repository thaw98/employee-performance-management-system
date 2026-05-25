package com.epms.backend.dto.appraisal;

import java.time.LocalDate;

public record AppraisalHistorySummaryRowDto(
        Long cycleId,
        String cycleName,
        LocalDate cycleStartDate,
        LocalDate cycleEndDate,
        Long departmentId,
        String departmentName,
        Long positionId,
        String positionName,
        long totalCount,
        long hrApprovedCount,
        long finalizedCount,
        Double averageScore) {
}
