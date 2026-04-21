package com.epms.backend.controller;

import java.util.Locale;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.hr.ExistsResponseDto;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
@PreAuthorize("hasRole('HR')")
public class EmployeeDuplicateCheckController {

	private final EmployeeRepository employeeRepository;
	private final UserRepository userRepository;

	@GetMapping("/check-email")
	public ResponseEntity<ApiResponse<ExistsResponseDto>> checkEmail(@RequestParam String email) {
		String normalized = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
		if (normalized.isEmpty()) {
			return ResponseEntity.ok(ApiResponse.ok("OK", new ExistsResponseDto(false)));
		}
		boolean exists = employeeRepository.existsByEmailIgnoreCase(normalized)
				|| userRepository.existsByEmployee_EmailIgnoreCase(normalized);
		return ResponseEntity.ok(ApiResponse.ok("OK", new ExistsResponseDto(exists)));
	}

	@GetMapping("/check-staff-no")
	public ResponseEntity<ApiResponse<ExistsResponseDto>> checkStaffNo(@RequestParam String staffNo) {
		String t = staffNo == null ? "" : staffNo.trim();
		if (t.isEmpty() || !t.matches("^[0-9]+$")) {
			return ResponseEntity.ok(ApiResponse.ok("OK", new ExistsResponseDto(false)));
		}
		boolean exists = employeeRepository.existsByEmployeeId(t);
		return ResponseEntity.ok(ApiResponse.ok("OK", new ExistsResponseDto(exists)));
	}
}
