package com.epms.backend.dto.employee;

import java.time.LocalDate;

import com.epms.backend.entity.Gender;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class EmployeeInfoResponseDto {
	private Long id;
	/** Business employee identifier ({@code employees.employee_id}). */
	private String employeeId;
	private String employeeName;
	private String email;
	private String staffNrcNo;
	private Gender gender;
	private String religion;
	private Long departmentId;
	private String departmentName;
	private Long positionId;
	private String positionName;
	private String levelCode;
	private Long managerId;
	private String managerName;
	private Long staffTypeId;
	private String staffTypeName;
	private LocalDate dateOfJoining;
	private String status;
	private Integer probationMonth;
	private LocalDate probationEndDate;
	private String fatherName;
	private String fatherNrcNo;
	private String fatherOccupation;
	private String emergencyPhone;
	private String emergencyRelation;
	private String profilePictureBase64;
}
