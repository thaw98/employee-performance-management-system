package com.epms.backend.dto.user;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class CreateEmployeeAccountResponseDto {
	private Long userId;
	private String employeeId;
	private String email;
	private Long roleId;
	private boolean mustChangePassword;
	private boolean active;
	/** False when SMTP fails after the user row was created (account still exists). */
	private boolean emailSent;
}
