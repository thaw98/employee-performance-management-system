package com.epms.backend.dto.employee;

import java.time.LocalDate;

import com.epms.backend.entity.Gender;

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
	private String email;
	private String staffNrcNo;
	private Gender gender;
	private String religion;
	private String fatherName;
	private String fatherNrcNo;
	private String fatherOccupation;
	private String emergencyPhone;
	private String emergencyRelation;
	private Long departmentId;
	private Long positionId;
	private Long managerId;
	private LocalDate dateOfJoining;
	private Long staffTypeId;
	private Integer probationDays;
	private LocalDate probationEndDate;
	private String profilePictureUrl;
}
