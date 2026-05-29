package com.epms.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class FeedbackAuditTotalsDto {
    private Long totalEvaluatees;
    private Long totalFeedbackCount;
    private Long anonymousCount;
    private Long nonAnonymousCount;
    private Double averageScore;
}
