package com.epms.backend.dto.feedbackmanagement;

import lombok.Data;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
public class FeedbackTemplateConfigDto {
    private Long id;
    private String templateName;
    private String targetType;
    private Long targetId;
    private String targetName;
    private Long reviewCycleId;
    private String reviewCycleName;
    private List<Long> questionIds = new ArrayList<>();
    private String status;
    private Instant createdDate;
    private Instant updatedDate;
}
