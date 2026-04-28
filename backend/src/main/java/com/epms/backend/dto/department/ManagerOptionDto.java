package com.epms.backend.dto.department;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ManagerOptionDto {
    private Long employeeId;
    private String fullName;
    private String staffNo;
    private String departmentName;
    private String positionName;
}
