package com.epms.backend.dto;

import lombok.Data;
import java.time.Instant;

@Data
public class FeedbackHistoryDto {
    private Long id;
    private Instant date;
    private String evaluatorName;
    private String evaluateeName;
    private String evaluateeStaffNo;
    private String position;
    private String role;
    private Double score;
    private String remark;
    private Boolean anonymous;
}
