package com.epms.backend.dto.continuousfeedback;

import java.time.Instant;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContinuousFeedbackEvidenceDto {
    private Long feedbackId;
    private String category;
    private String feedbackMessage;
    private String employeeName;
    private Long employeeId;
    private String managerName;
    private Instant createdAt;
    private boolean acknowledged;
    private Instant acknowledgedAt;
    private List<ContinuousFeedbackActionItemDto> actionItems;
}
