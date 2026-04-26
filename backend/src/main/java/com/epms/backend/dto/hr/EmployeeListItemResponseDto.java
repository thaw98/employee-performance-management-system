package com.epms.backend.dto.hr;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeListItemResponseDto {
    private Long employeeId;
    private String staffNo;
    private String employeeName;
    private String departmentName;
    private String positionName;
    private String staffTypeName;
    private String phoneNumber;
    private String profilePictureUrl;
    private String email;
    private Boolean mustChangePassword;
    private Boolean hasUserAccount;
    private String employmentStatus;
    private String employeeActiveStatus; // ACTIVE, RESIGNED, TERMINATED
    private String currentTransferType;
}
