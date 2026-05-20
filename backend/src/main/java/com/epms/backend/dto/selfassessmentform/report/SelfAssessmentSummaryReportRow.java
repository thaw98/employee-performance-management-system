package com.epms.backend.dto.selfassessmentform.report;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SelfAssessmentSummaryReportRow {
    private final Integer rowNumber;
    private final String employeeName;
    private final String staffNo;
    private final String department;
    private final String position;
    private final String scorePercentage;
    private final String performance;
    private final String status;
    private final String submittedDate;
    private final String finalApprovalDate;
}
