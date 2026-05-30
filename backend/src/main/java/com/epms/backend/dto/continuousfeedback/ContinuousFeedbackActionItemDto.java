package com.epms.backend.dto.continuousfeedback;

import java.time.Instant;
import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContinuousFeedbackActionItemDto {
    private Long actionItemId;
    private Long feedbackId;
    private String description;
    private LocalDate dueDate;
    private String status;
    private Instant completedAt;
    private Instant createdAt;
    private Instant updatedAt;
}
