package com.epms.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class FeedbackAuditEvaluateeHistoryDto {
    private FeedbackAuditSummaryRowDto evaluatee;
    private org.springframework.data.domain.Page<FeedbackHistoryDto> history;
}
