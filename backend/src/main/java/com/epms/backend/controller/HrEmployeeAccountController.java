package com.epms.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.hr.HrCreateEmployeeAccountRequestDto;
import com.epms.backend.dto.hr.HrCreateEmployeeAccountResponseDto;
import com.epms.backend.dto.hr.MessageResponseDto;
import com.epms.backend.dto.hr.NextStaffNoResponseDto;
import com.epms.backend.security.UserPrincipal;
import com.epms.backend.service.HrEmployeeAccountService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/hr/employees")
@RequiredArgsConstructor
@PreAuthorize("hasRole('HR')")
public class HrEmployeeAccountController {

	private final HrEmployeeAccountService hrEmployeeAccountService;

	@GetMapping("/next-staff-no")
	public ResponseEntity<ApiResponse<NextStaffNoResponseDto>> nextStaffNo(
			@AuthenticationPrincipal UserPrincipal principal) {
		try {
			return ResponseEntity.ok(ApiResponse.ok(
					"Next staff number",
					hrEmployeeAccountService.suggestNextStaffNo(principal)));
		} catch (RuntimeException ex) {
			return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
		}
	}

	@PostMapping("/create-account")
	public ResponseEntity<ApiResponse<HrCreateEmployeeAccountResponseDto>> createAccount(
			@AuthenticationPrincipal UserPrincipal principal,
			@Valid @RequestBody HrCreateEmployeeAccountRequestDto request) {
		try {
			return ResponseEntity.ok(ApiResponse.ok(
					"Employee account created",
					hrEmployeeAccountService.createAccount(request, principal)));
		} catch (RuntimeException ex) {
			return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
		}
	}

	@PostMapping("/{employeeId}/resend-temporary-password")
	public ResponseEntity<ApiResponse<MessageResponseDto>> resendTemporaryPassword(
			@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable Long employeeId) {
		try {
			return ResponseEntity.ok(ApiResponse.ok(
					"OK",
					hrEmployeeAccountService.resendTemporaryPassword(employeeId, principal)));
		} catch (RuntimeException ex) {
			return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
		}
	}
}
