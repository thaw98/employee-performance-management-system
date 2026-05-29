package com.epms.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
public class FeedbackAuditSummaryRowDto {
    private Long employeeId;
    private String employeeName;
    private String staffNo;
    private String position;
    private String department;
    private Long feedbackCount;
    private Long anonymousCount;
    private Long nonAnonymousCount;
    private Double averageScore;
    private Instant latestFeedbackDate;
    private Long reviewCycleId;
    private String reviewCycleName;
}
