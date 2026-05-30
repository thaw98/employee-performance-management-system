package com.epms.backend.dto.continuousfeedback;

import java.time.LocalDate;

import lombok.Data;

@Data
public class ContinuousFeedbackActionItemRequest {
    private String description;
    private LocalDate dueDate;
}
