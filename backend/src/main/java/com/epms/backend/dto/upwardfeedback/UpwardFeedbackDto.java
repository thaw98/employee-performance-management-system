package com.epms.backend.dto.upwardfeedback;

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
public class UpwardFeedbackDto {
    private Long feedbackId;
    private Long employeeId;
    private String employeeName;
    private String employeeBusinessId;
    private Long managerId;
    private String managerName;
    private String message;
    private String status;
    private Instant closedAt;
    private Long closedByUserId;
    private Instant createdAt;
    private Instant updatedAt;
    private Long createdByUserId;
    private Long updatedByUserId;
    private List<UpwardFeedbackReplyDto> replies;
    private List<UpwardFeedbackHistoryDto> history;
}
