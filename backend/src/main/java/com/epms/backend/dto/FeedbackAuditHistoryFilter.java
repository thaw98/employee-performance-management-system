package com.epms.backend.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class FeedbackAuditHistoryFilter {
    private String search;
    private String department;
    private Long reviewCycleId;
    private String feedbackType;
    private LocalDate fromDate;
    private LocalDate toDate;
}
