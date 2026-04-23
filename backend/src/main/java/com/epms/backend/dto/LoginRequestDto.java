package com.epms.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequestDto {

	@NotBlank(message = "Invalid credentials")
	private String email;

	@NotBlank(message = "Invalid credentials")
	private String password;
}
