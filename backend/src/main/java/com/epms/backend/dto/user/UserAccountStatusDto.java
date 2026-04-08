package com.epms.backend.dto.user;

public record UserAccountStatusDto(
		Long userId,
		String employeeId,
		String email,
		boolean active) {
}
