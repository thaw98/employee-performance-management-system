package com.epms.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthUserDto {

	private Long id;
	private String employeeId;
	private String name;
	private String email;
	private String role;
	private Long roleId;
	private boolean mustChangePassword;
}
