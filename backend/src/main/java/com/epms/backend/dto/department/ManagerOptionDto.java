package com.epms.backend.dto.department;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManagerOptionDto {
    private Long employeeId;
    private String fullName;
    private String staffNo;
    private String email;
    private String phoneNumber;
    private Long departmentId;
    private String departmentName;
    private String departmentCode;
    private String positionName;
    private String positionCode;
    private Long userId;
    private String roleName;
}
