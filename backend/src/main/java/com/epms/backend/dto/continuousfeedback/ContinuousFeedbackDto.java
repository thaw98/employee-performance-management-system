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
public class ContinuousFeedbackDto {
    private Long feedbackId;
    private Long employeeId;
    private String employeeName;
    private String employeeBusinessId;
    private Long managerId;
    private String managerName;
    private String category;
    private String feedbackMessage;
    private String privateManagerNote;
    private String visibilityStatus;
    private Instant scheduledPublishAt;
    private Long scheduledByUserId;
    private Instant cancelledAt;
    private Long cancelledByUserId;
    private boolean shared;
    private Instant sharedAt;
    private boolean acknowledged;
    private Instant acknowledgedAt;
    private boolean supportingEvidence;
    private boolean pipSuggested;
    private Instant pipSuggestedAt;
    private Instant createdAt;
    private Instant updatedAt;
    private Long createdByUserId;
    private Long updatedByUserId;
    private List<ContinuousFeedbackActionItemDto> actionItems;
    private List<ContinuousFeedbackCommentDto> comments;
}
