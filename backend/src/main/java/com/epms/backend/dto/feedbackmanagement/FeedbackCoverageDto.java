package com.epms.backend.dto.feedbackmanagement;

import java.util.List;

public record FeedbackCoverageDto(
        SelectedReviewCycleDto selectedReviewCycle,
        int eligibleCount,
        int coveredCount,
        int uncoveredCount,
        int noTemplateCount,
        double coveragePercent,
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
            String levelCode,
            String missingReason
    ) {}
}
