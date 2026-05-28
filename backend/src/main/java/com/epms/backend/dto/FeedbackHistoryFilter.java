package com.epms.backend.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class FeedbackHistoryFilter {
    private String direction;
    private Long reviewCycleId;
    private String status;
    private LocalDate fromDate;
    private LocalDate toDate;
    private String reviewer;
    private String reviewee;
    private String peopleSearch;
    private String feedbackType;
}
