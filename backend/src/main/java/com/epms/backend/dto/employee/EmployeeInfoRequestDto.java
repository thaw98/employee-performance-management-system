package com.epms.backend.dto.employee;

import java.time.LocalDate;

import com.epms.backend.entity.Gender;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EmployeeInfoRequestDto {
	@Size(max = 20)
	private String employeeId;

	@NotBlank
	@Size(max = 100)
	private String employeeName;

	@NotBlank
	@Size(max = 100)
	@Email
	private String email;

	@Size(max = 100)
	@NotBlank(message = "NRC number is required")
	private String staffNrcNo;

	@NotNull
	private Gender gender;

	private String religion;

	@NotBlank(message = "Father name is required")
	@Size(max = 100)
	private String fatherName;
	private String fatherNrcNo;
	private String fatherOccupation;
	private String emergencyPhone;
	@NotBlank(message = "Relationship to employee is required")
	@Size(max = 100)
	private String emergencyRelation;

	@NotNull
	private Long departmentId;

	@NotNull
	private Long positionId;

	private Long managerId;

	@NotNull
	private LocalDate dateOfJoining;

	@NotNull
	private Long staffTypeId;

	private Integer probationDays;
	private LocalDate probationEndDate;

	private String profilePictureUrl;
}
