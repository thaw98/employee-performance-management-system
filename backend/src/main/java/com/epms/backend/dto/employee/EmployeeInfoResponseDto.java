package com.epms.backend.dto.employee;

import java.time.LocalDate;

import com.epms.backend.entity.Gender;
import com.epms.backend.entity.MaritalStatus;

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
	private String staffNrcNo;
	private Gender gender;
	private String race;
	private Long religionId;
	private String religionName;
	private LocalDate dateOfBirth;
	private String phoneNo;
	private String emailAddress;
	private MaritalStatus maritalStatus;
	private Long departmentId;
	private String departmentName;
	private Long positionId;
	private String positionName;
	private String nationality;
	private Long staffTypeId;
	private String staffTypeName;
	private LocalDate dateOfJoining;
	private String passportNo;
	private LocalDate passportExpireDate;
	private LocalDate dateOfDemotion;
	private LocalDate dateOfTitleChange;
	private LocalDate dateOfPromotion;
	private LocalDate dateOfTransfer;
	private Integer probationMonth;
	private LocalDate probationStartDate;
	private LocalDate probationEndDate;
	private String fatherName;
	private String fatherNrcNo;
	private String fatherOccupation;
	private String spouseName;
	private String spouseNrcNo;
	private String spouseOccupation;
	private String emergencyPhone;
	private String emergencyRelation;
	private String recordStatus;
}
