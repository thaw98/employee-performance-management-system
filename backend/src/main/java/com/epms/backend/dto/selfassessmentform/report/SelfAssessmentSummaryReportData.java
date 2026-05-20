package com.epms.backend.dto.selfassessmentform.report;

import java.util.List;

public record SelfAssessmentSummaryReportData(
        Long cycleId,
        String cycleName,
        int totalRecords,
        String averageScore,
        String highestScore,
        String lowestScore,
        List<SelfAssessmentSummaryReportRow> rows
) {}
