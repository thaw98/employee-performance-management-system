package com.epms.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class FeedbackSubmissionDto {
    private Long evaluateePositionId;
    private String evaluateeName;
    private Integer totalPoints;
    private Double totalScore;
    private String scoreGrade;
    private List<FeedbackDetailDto> details;
}
