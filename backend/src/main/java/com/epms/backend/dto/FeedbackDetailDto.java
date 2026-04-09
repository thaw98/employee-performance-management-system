package com.epms.backend.dto;

import lombok.Data;

@Data
public class FeedbackDetailDto {
    private Long criteriaId;
    private Integer rating;
    private String comment;
}
