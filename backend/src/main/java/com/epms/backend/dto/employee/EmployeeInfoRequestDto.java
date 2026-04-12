package com.epms.backend.dto.employee;

import java.time.LocalDate;

import com.epms.backend.entity.Gender;
import com.epms.backend.entity.MaritalStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EmployeeInfoRequestDto {
	/** Optional business id (digits only, max 100); if omitted, defaults to the string form of the employee PK after save. */
	@Size(max = 100)
	private String employeeId;

	@NotBlank
	@Size(max = 50)
	private String employeeName;

	private String otherName;

	@NotBlank
	@Size(max = 100)
	private String staffNrcNo;

	@NotNull
	private Gender gender;

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

	private MaritalStatus maritalStatus;
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

	@NotNull
	private Long staffTypeId;

	private String passportNo;
	private LocalDate passportExpireDate;
	private LocalDate dateOfDemotion;
	private LocalDate dateOfTitleChange;
	private LocalDate dateOfPromotion;
	private LocalDate dateOfTransfer;

	private LocalDate probationStartDate;
	/** 1, 3, or 6 for fixed periods; null with {@link #probationEndDate} for custom. */
	private Integer probationMonth;
	private LocalDate probationEndDate;

	/** Optional data URL or base64; persisted on {@code employees.profile_picture_base64}. Omitted on update leaves existing value unchanged. */
	private String profilePictureBase64;
}
