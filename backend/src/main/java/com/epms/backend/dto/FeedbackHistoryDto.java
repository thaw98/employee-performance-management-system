package com.epms.backend.dto;

import lombok.Data;
import java.time.Instant;
import java.time.LocalDate;

@Data
public class FeedbackHistoryDto {
    private Long id;
    private Instant date;
    private String direction;
    private String evaluatorName;
    private String evaluatorStaffNo;
    private String evaluatorPosition;
    private String evaluatorDepartment;
    private String evaluateeName;
    private String evaluateeStaffNo;
    private String evaluateePosition;
    private String evaluateeDepartment;
    private String position;
    private String role;
    private Double score;
    private String remark;
    private Boolean anonymous;
    private String additionalComments;
    private String status;
    private Long reviewCycleId;
    private String reviewCycleName;
    private LocalDate reviewCycleStartDate;
    private Integer maxRating;
}
