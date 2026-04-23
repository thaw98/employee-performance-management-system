package com.epms.backend.dto.pip;

import lombok.Data;

@Data
public class ProgressUpdateRequest {
    private Integer progressPercentage;
    private Integer completedHours;
    private String feedback;
}
