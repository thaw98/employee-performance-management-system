package com.epms.backend.dto.feedbackmanagement;

import java.util.List;

public record FeedbackCoverageDto(
        SelectedReviewCycleDto selectedReviewCycle,
        int eligibleCount,
        int coveredCount,
        int uncoveredCount,
        double coveragePercent,
        List<CoverageEmployeeRow> coveredEmployees,
        List<CoverageEmployeeRow> uncoveredEmployees
) {
    public record SelectedReviewCycleDto(
            Long id,
            String name,
            String code,
            String startDate,
            String endDate,
            String status
    ) {}

    public record CoverageEmployeeRow(
            Long employeeId,
            String employeeCode,
            String employeeName,
            Long departmentId,
            String departmentName,
            Long positionId,
            String positionName,
            Long levelCodeId,
            String levelCode
    ) {}
}
