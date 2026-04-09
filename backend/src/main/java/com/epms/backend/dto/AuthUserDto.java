package com.epms.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuthUserDto {

	private Long id;
	private String employeeId;
	private String email;
	private String role;
	private Long roleId;
}
