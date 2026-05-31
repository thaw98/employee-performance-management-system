package com.epms.backend.dto.selfassessmentform.report;

import java.util.List;

public record SelfAssessmentAnalyticsReportDto(
        String role,
        CycleMetadata selectedCycle,
        OverallTotals overallTotals,
        GroupSummary highestDepartment,
        GroupSummary lowestDepartment,
        List<GroupSummary> departmentSummaries,
        List<GroupSummary> positionSummaries,
        List<PerformanceBandRadarPoint> performanceBandRadar,
        List<PerformerHighlight> performerHighlights,
        List<EmployeeDirectoryRow> employeeDirectory
) {
    public record CycleMetadata(
            Long id,
            String name,
            String startDate,
            String endDate
    ) {}

    public record OverallTotals(
            int recordCount,
            double averageScore,
            double highestScore,
            double lowestScore,
            int missedCount
    ) {}

    public record GroupSummary(
            Long groupId,
            String groupCode,
            Long departmentId,
            String departmentName,
            String groupName,
            int employeeCount,
            double averageScore,
            double highestScore,
            double lowestScore,
            int missedCount
    ) {}

    public record PerformanceBandRadarPoint(
            String groupName,
            int outstanding,
            int good,
            int meetRequirement,
            int needImprovement,
            int unsatisfactory,
            double outstandingPercent,
            double goodPercent,
            double meetRequirementPercent,
            double needImprovementPercent,
            double unsatisfactoryPercent
    ) {}

    public record PerformerHighlight(
            String groupName,
            List<PerformerScore> highestPerformers,
            List<PerformerScore> lowestPerformers
    ) {}

    public record PerformerScore(
            Long employeeId,
            String staffNo,
            String employeeName,
            String departmentName,
            String positionName,
            double score,
            String performance,
            String status
    ) {}

    public record EmployeeDirectoryRow(
            Long employeeId,
            String staffNo,
            String employeeName,
            Long departmentId,
            String departmentName,
            Long positionId,
            String positionName,
            double selectedCycleScore,
            String performance,
            String status
    ) {}
}
