package com.epms.backend.dto;

import lombok.Data;

@Data
public class FeedbackTargetDto {
    private Long id; // User DB ID
    private Long employeeDbId;
    private String employeeId;
    private String employeeName;
    private String departmentName;
    private String positionName;
    private String roleName;
}
