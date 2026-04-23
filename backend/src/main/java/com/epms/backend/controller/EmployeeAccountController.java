package com.epms.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.user.CreateEmployeeAccountRequestDto;
import com.epms.backend.dto.user.CreateEmployeeAccountResponseDto;
import com.epms.backend.dto.user.UpdateUserAccountStatusRequestDto;
import com.epms.backend.dto.user.UserAccountStatusDto;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.service.EmployeeAccountService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('HR')")
public class EmployeeAccountController {
	private final EmployeeAccountService employeeAccountService;
	private final UserRepository userRepository;

	@PostMapping("/employee-account")
	public ResponseEntity<ApiResponse<CreateEmployeeAccountResponseDto>> create(@Valid @RequestBody CreateEmployeeAccountRequestDto request) {
		try {
			return ResponseEntity.ok(ApiResponse.ok("Employee account created", employeeAccountService.createEmployeeAccount(request)));
		} catch (RuntimeException ex) {
			return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
		}
	}

	@GetMapping("/check-email")
	public ResponseEntity<ApiResponse<Boolean>> checkEmail(@RequestParam String email) {
		return ResponseEntity.ok(ApiResponse.ok("Checked", userRepository.existsByEmployee_EmailIgnoreCase(email)));
	}

	@GetMapping("/by-employee/{employeeId}")
	public ResponseEntity<ApiResponse<Boolean>> byEmployee(@PathVariable Long employeeId) {
		return ResponseEntity.ok(ApiResponse.ok("Checked", userRepository.findByEmployee_Id(employeeId).isPresent()));
	}

	@PutMapping("/{userId}/status")
	public ResponseEntity<ApiResponse<UserAccountStatusDto>> updateAccountStatus(
			@PathVariable Long userId,
			@Valid @RequestBody UpdateUserAccountStatusRequestDto request) {
		try {
			UserAccountStatusDto response = employeeAccountService.updateUserAccountStatus(userId, request.getActive());
			return ResponseEntity.ok(ApiResponse.ok("User account status updated", response));
		} catch (RuntimeException ex) {
			return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
		}
	}
}
