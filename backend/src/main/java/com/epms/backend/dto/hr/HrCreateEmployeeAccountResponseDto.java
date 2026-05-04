package com.epms.backend.dto.hr;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HrCreateEmployeeAccountResponseDto {
	private Long employeeId;
	private String staffNo;
	private Long userAccountId;
	private String employeeName;
	private String email;
	private Long roleId;
	private boolean mustChangePassword;
	private String message;
	private boolean assignedAsDepartmentManager;
	private String managerAssignmentWarning;
}
