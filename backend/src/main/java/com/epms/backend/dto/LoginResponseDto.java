package com.epms.backend.dto;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponseDto {

	private String token;
	private String tokenType = "Bearer";
	private Instant expiresAt;
	private AuthUserDto user;
}
