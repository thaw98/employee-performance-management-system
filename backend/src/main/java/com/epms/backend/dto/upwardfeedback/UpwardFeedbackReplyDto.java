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
public class UpwardFeedbackReplyDto {
    private Long replyId;
    private Long feedbackId;
    private Long authorEmployeeId;
    private String authorEmployeeName;
    private String message;
    private Instant createdAt;
}
