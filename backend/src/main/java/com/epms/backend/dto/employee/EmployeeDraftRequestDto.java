package com.epms.backend.dto.employee;

import java.time.LocalDate;

import lombok.Getter;
import lombok.Setter;

/**
 * Partial employee payload for draft create/update. All fields optional — empty or omitted values are stored as null.
 */
@Getter
@Setter
public class EmployeeDraftRequestDto {
	private String employeeId;
	private String employeeName;
	private String otherName;
	private String nrcStateCode;
	private String nrcTownshipCode;
	private String nrcType;
	private String nrcNumber;
	private String gender;
	private String race;
	private Long religionId;
	private LocalDate dateOfBirth;
	private String birthPlace;
	private String contactAddress;
	private String permanentAddress;
	private String phoneNo;
	private String emailAddress;
	private String maritalStatus;
	private String spouseName;
	private String spouseNrcNo;
	private String fatherName;
	private String fatherNrcNo;
	private String fatherOccupation;
	private String spouseOccupation;
	private String emergencyPhone;
	private String emergencyRelation;
	private Long departmentId;
	private Long positionId;
	private String nationality;
	private LocalDate dateOfJoining;
	private Boolean onProbation;
	private LocalDate probationStartDate;
	private Integer probationMonth;
	private LocalDate probationEndDate;
}
