package com.epms.backend.dto.employee;

import java.time.LocalDate;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class EmployeeInfoResponseDto {
	private Long id;
	private String employeeId;
	private String employeeName;
	private String nrcStateCode;
	private String nrcTownshipCode;
	private String nrcType;
	private String nrcNumber;
	private String nrcFull;
	private String gender;
	private String race;
	private Long religionId;
	private String religionName;
	private LocalDate dateOfBirth;
	private String phoneNo;
	private String emailAddress;
	private Long departmentId;
	private String departmentName;
	private Long positionId;
	private String positionName;
	private Long nationalityId;
	private String nationalityName;
	private LocalDate dateOfJoining;
	private Integer probationMonth;
	private LocalDate probationStartDate;
	private LocalDate probationEndDate;
	private String recordStatus;
}
