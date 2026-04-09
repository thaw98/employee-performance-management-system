package com.epms.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.employee.EmployeeDraftRequestDto;
import com.epms.backend.dto.employee.EmployeeInfoRequestDto;
import com.epms.backend.dto.employee.EmployeeInfoResponseDto;
import com.epms.backend.security.UserPrincipal;
import com.epms.backend.service.EmployeeService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
@PreAuthorize("hasRole('HR')")
public class EmployeeController {
	private final EmployeeService employeeService;

	@PostMapping
	public ResponseEntity<ApiResponse<EmployeeInfoResponseDto>> createCompleted(
			@AuthenticationPrincipal UserPrincipal principal,
			@Valid @RequestBody EmployeeInfoRequestDto request) {
		try {
			return ResponseEntity.ok(ApiResponse.ok("Employee information saved", employeeService.saveCompleted(request, principal)));
		} catch (RuntimeException ex) {
			return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
		}
	}

	@PostMapping("/draft")
	public ResponseEntity<ApiResponse<EmployeeInfoResponseDto>> createDraft(
			@AuthenticationPrincipal UserPrincipal principal,
			@RequestBody EmployeeDraftRequestDto request) {
		try {
			return ResponseEntity.ok(ApiResponse.ok("Draft saved", employeeService.saveDraft(request, principal)));
		} catch (RuntimeException ex) {
			return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
		}
	}

	@PutMapping("/{id}")
	public ResponseEntity<ApiResponse<EmployeeInfoResponseDto>> updateCompleted(
			@PathVariable Long id,
			@AuthenticationPrincipal UserPrincipal principal,
			@Valid @RequestBody EmployeeInfoRequestDto request) {
		try {
			return ResponseEntity.ok(ApiResponse.ok("Employee information updated", employeeService.updateCompleted(id, request, principal)));
		} catch (RuntimeException ex) {
			return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
		}
	}

	@PutMapping("/{id}/draft")
	public ResponseEntity<ApiResponse<EmployeeInfoResponseDto>> updateDraft(
			@PathVariable Long id,
			@AuthenticationPrincipal UserPrincipal principal,
			@RequestBody EmployeeDraftRequestDto request) {
		try {
			return ResponseEntity.ok(ApiResponse.ok("Draft updated", employeeService.updateDraft(id, request, principal)));
		} catch (RuntimeException ex) {
			return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
		}
	}

	@GetMapping("/{id}")
	public ResponseEntity<ApiResponse<EmployeeInfoResponseDto>> getById(@PathVariable Long id) {
		try {
			return ResponseEntity.ok(ApiResponse.ok("Employee retrieved", employeeService.getById(id)));
		} catch (RuntimeException ex) {
			return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
		}
	}

	@GetMapping("/check-employee-id")
	public ResponseEntity<ApiResponse<Boolean>> checkEmployeeId(@RequestParam String employeeId) {
		return ResponseEntity.ok(ApiResponse.ok("Checked", employeeService.isEmployeeIdTaken(employeeId)));
	}

	@GetMapping("/check-email")
	public ResponseEntity<ApiResponse<Boolean>> checkEmail(@RequestParam String email) {
		return ResponseEntity.ok(ApiResponse.ok("Checked", employeeService.isEmailTakenAnywhere(email)));
	}

	@GetMapping("/autocomplete")
	public ResponseEntity<ApiResponse<List<EmployeeInfoResponseDto>>> autocomplete(@RequestParam(defaultValue = "") String keyword) {
		return ResponseEntity.ok(ApiResponse.ok("Employees", employeeService.autocomplete(keyword)));
	}
}
