package com.epms.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequestDto {

	@NotBlank(message = "Invalid credentials")
	private String identifier;

	@NotBlank(message = "Invalid credentials")
	private String password;
}
