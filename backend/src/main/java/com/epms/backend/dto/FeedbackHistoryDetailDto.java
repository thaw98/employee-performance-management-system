package com.epms.backend.dto;

import lombok.Data;

@Data
public class FeedbackHistoryDetailDto {
    private String criteriaName;
    private Integer rating;
    private String comment;
}
