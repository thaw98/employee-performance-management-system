package com.epms.backend.dto.hr;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EmployeeKpiStatusDto {
    private Long employeeId;
    private String staffNo;
    private String employeeName;
    private String departmentName;
    private String positionName;
    private String profilePictureUrl;
    private boolean hasKpis;
    private String period;
}
