package com.epms.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class FeedbackDetailDto {
    private String criteriaName;
    private Integer rating;
    private String comment;
}
