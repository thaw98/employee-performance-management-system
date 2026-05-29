package com.epms.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class FeedbackAuditSummaryPageDto {
    private List<FeedbackAuditSummaryRowDto> content;
    private int page;
    private int size;
    private int totalPages;
    private Long totalElements;
    private FeedbackAuditTotalsDto totals;
}
