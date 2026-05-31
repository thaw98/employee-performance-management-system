package com.epms.backend.dto.upwardfeedback;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpwardFeedbackHistoryDto {
    private Long historyId;
    private Long feedbackId;
    private Long actorEmployeeId;
    private String actorEmployeeName;
    private String eventType;
    private String description;
    private Instant createdAt;
}
