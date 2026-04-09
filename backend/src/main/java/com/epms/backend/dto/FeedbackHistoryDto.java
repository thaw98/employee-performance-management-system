package com.epms.backend.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class FeedbackHistoryDto {
    private Long id;
    private String evaluateeName;
    private String evaluateeDepartment;
    private String evaluateePosition;
    private LocalDate assessmentDate;
    private Integer totalPoints;
    private Double totalScore;
    private String scoreGrade;
    private List<FeedbackHistoryDetailDto> details;
}
