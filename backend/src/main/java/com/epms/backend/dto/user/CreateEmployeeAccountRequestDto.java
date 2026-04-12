package com.epms.backend.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateEmployeeAccountRequestDto {
	@NotNull
	private Long employeePkId;

	/** Login email; stored on {@code users.email}. */
	@NotBlank
	@Email
	private String email;

	private String profilePictureBase64;
}
