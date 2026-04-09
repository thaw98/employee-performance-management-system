package com.epms.backend.dto.employee;

import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EmployeeInfoRequestDto {
	@NotBlank
	@Pattern(regexp = "^[0-9]+$", message = "Employee ID must be numeric only")
	private String employeeId;

	@NotBlank
	@Size(max = 50)
	private String employeeName;

	private String otherName;

	@NotBlank
	@Pattern(regexp = "^(1[0-4]|[1-9])$", message = "Invalid NRC state code")
	private String nrcStateCode;

	@NotBlank
	@Pattern(regexp = "^[A-Z]{3,10}$", message = "Invalid NRC township code")
	private String nrcTownshipCode;

	@NotBlank
	@Pattern(regexp = "^[A-Z]{1,2}$", message = "Invalid NRC type")
	private String nrcType;

	@NotBlank
	@Pattern(regexp = "^[0-9]{1,10}$", message = "NRC number must be digits only")
	private String nrcNumber;

	@NotBlank
	@Pattern(regexp = "^(Male|Female)$", message = "Gender must be Male or Female")
	private String gender;

	@NotBlank
	private String race;

	@NotNull
	private Long religionId;

	@NotNull
	private LocalDate dateOfBirth;

	private String birthPlace;

	@NotBlank
	@Size(max = 500)
	private String contactAddress;
	private String permanentAddress;

	@NotBlank
	@Pattern(regexp = "^\\+?[0-9]{8,15}$", message = "Invalid phone number format")
	private String phoneNo;

	@NotBlank
	@Email
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

	@NotNull
	private Long departmentId;

	@NotNull
	private Long positionId;

	@NotBlank
	@Size(max = 100)
	private String nationality;

	@NotNull
	private LocalDate dateOfJoining;

	private Boolean onProbation;
	private LocalDate probationStartDate;
	/** 1, 3, or 6 for fixed periods; null with {@link #probationEndDate} for custom. */
	private Integer probationMonth;
	private LocalDate probationEndDate;
}
