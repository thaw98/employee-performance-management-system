package com.epms.backend.dto.selfassessmentform;

import java.time.Instant;
import java.util.List;

public record AssignmentCoverageDto(
        CycleInfoDto activeCycle,
        int eligibleCount,
        int assignedCount,
        int leftToAssignCount,
        int noTemplateCount,
        double coveragePercent,
        List<CoverageEmployeeRow> assignedEmployees,
        List<CoverageEmployeeRow> unassignedEmployees
) {
    public record CoverageEmployeeRow(
            Long employeeId,
            String employeeCode,
            String employeeName,
            String departmentName,
            String positionName,
            String managerName,
            String assignmentStatus,
            Instant assignedDate,
            String templateTitle,
            String unassignedReason
    ) {}
}
