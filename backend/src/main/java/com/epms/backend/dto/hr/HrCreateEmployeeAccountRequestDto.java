package com.epms.backend.dto.hr;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonAlias;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HrCreateEmployeeAccountRequestDto {

	@NotBlank(message = "Staff number is required")
	@Size(max = 50, message = "Staff number must be at most 50 characters")
	@Pattern(regexp = "^[0-9]+$", message = "Staff number must contain digits only")
	@JsonAlias("staffNo")
	private String staffNo;

	@NotBlank(message = "Employee name is required")
	@Size(max = 50, message = "Employee name must be at most 50 characters")
	private String employeeName;

	@NotBlank(message = "Gender is required")
	@Pattern(regexp = "^(Male|Female)$", message = "Gender must be Male or Female")
	private String gender;

	@NotBlank
	@Email
	@Size(max = 255)
	private String email;

	@NotNull
	private LocalDate dateOfBirth;

	@NotBlank
	@Pattern(
			regexp = "^(?:\\+95[0-9]{5,12}|09[0-9]{6,13})$",
			message = "Phone number must be 8-15 characters, start with +95 or 09, contain no spaces, and use digits only (except leading +)")
	@JsonAlias({ "phone_number", "phoneNumber" })
	private String phoneNo;

	@NotBlank(message = "Address is required")
	@Size(max = 2000, message = "Address must be at most 2000 characters")
	private String address;

	@NotBlank(message = "Religion is required")
	private String religion;

	@NotBlank
	@Size(max = 100)
	private String nationality;

	@NotBlank(message = "NRC number is required")
	@Size(max = 100)
	private String nrc;

	@NotBlank(message = "Father name is required")
	@Size(max = 100)
	private String fatherName;

	@Size(max = 100)
	private String fatherNrc;

	@NotBlank(message = "Father occupation is required")
	@Size(max = 100)
	private String fatherOccupation;

	@NotBlank
	@Pattern(
			regexp = "^(?:\\+95[0-9]{5,12}|09[0-9]{6,13})$",
			message = "Emergency phone must be 8-15 characters, start with +95 or 09, contain no spaces, and use digits only (except leading +)")
	@JsonAlias({ "emergency_phone", "emergencyPhone" })
	private String emergencyPhone;

	@NotBlank
	@Size(max = 50)
	@JsonAlias({ "emergency_relation", "emergencyRelation" })
	private String emergencyRelation;

	@NotBlank
	@Pattern(regexp = "^(PERMANENT|PROBATION)$", message = "staffType must be PERMANENT or PROBATION")
	private String staffType;

	private LocalDate probationStartDate;

	private LocalDate probationEndDate;

	@NotNull
	private LocalDate hireDate;

	@NotNull
	private Long departmentId;

	@NotNull
	private Long positionId;

	private String profilePictureUrl;
}
