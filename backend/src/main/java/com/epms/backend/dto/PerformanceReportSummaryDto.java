package com.epms.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceReportSummaryDto {

    // Employee Info
    private Long employeeId;
    private String staffNo;
    private String employeeName;
    private String departmentName;
    private String positionName;
    private String profilePictureUrl;
    private String joinedDate;

    // KPI
    private Double kpiScore;
    private String kpiPeriod;

    // Appraisal
    private Double appraisalScore;
    private String appraisalPeriod;
    private String appraisalRatingCategory;

    // Self Assessment
    private Double selfAssessmentScore;
    private String selfAssessmentCycle;

    // Feedback
    private Double feedbackScore;
    private Integer feedbackCount;

    // PIP
    private boolean hasActivePip;
    private String pipStatus;

    // Overall
    private Double overallRating;
    private String performanceLevel;
    private String promotionEligibility;
    private boolean promotionEligible;

    // Latest Approved Promotion
    private Long latestApprovedPromotionId;
    private String latestApprovedPromotionReason;
    private String latestApprovedPromotionEffectiveDate;
    private String latestApprovedPromotionTargetPositionName;
}
