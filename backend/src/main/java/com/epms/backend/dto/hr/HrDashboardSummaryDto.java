package com.epms.backend.dto.hr;

import java.util.List;

public record HrDashboardSummaryDto(
        Overview overview,
        Visuals visuals,
        List<AttentionItem> needsAttention
) {
    public record Overview(
            long totalEmployees,
            long activeEmployees,
            long departments,
            long managers,
            long employeesInAppraisalCycle,
            long pendingSelfAssessments,
            long activePips,
            long upcomingMeetings
    ) {
    }

    public record Visuals(
            List<NameValue> employeeDistributionByDepartment,
            Progress appraisalCompletion,
            StatusBreakdown selfAssessmentSubmissionStatus,
            List<NameValue> pipStatusOverview,
            long upcomingMeetingsThisWeek
    ) {
    }

    public record Progress(long total, long completed, long pending, long overdue, int percentage) {
    }

    public record StatusBreakdown(long total, long submitted, long pending, long overdue, int percentage) {
    }

    public record NameValue(String name, long value) {
    }

    public record AttentionItem(String label, long value, String path, String severity) {
    }
}
