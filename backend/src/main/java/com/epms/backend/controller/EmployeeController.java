package com.epms.backend.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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
import com.epms.backend.service.EmployeeExportService;
import com.epms.backend.service.EmployeeService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeController {
	private final EmployeeService employeeService;
	private final EmployeeExportService employeeExportService;

	@GetMapping("/export")
	@PreAuthorize("hasAnyRole('HR', 'MANAGER', 'DEPARTMENT_HEAD', 'TEAM_HEAD', 'AUDIT') or principal.roleId == 5")
	public ResponseEntity<byte[]> exportEmployees() {
		byte[] bytes = employeeExportService.exportEmployees();
		String filename = "employees_export_" + LocalDate.now() + ".xlsx";
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.parseMediaType(
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
		headers.setContentDisposition(ContentDisposition.attachment().filename(filename).build());
		return ResponseEntity.ok().headers(headers).body(bytes);
	}

	@PostMapping
	@PreAuthorize("principal.roleId == 1")
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
	@PreAuthorize("principal.roleId == 1")
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
	@PreAuthorize("principal.roleId == 1")
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
	@PreAuthorize("principal.roleId == 1")
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
	@PreAuthorize("principal.roleId == 1")
	public ResponseEntity<ApiResponse<EmployeeInfoResponseDto>> getById(@PathVariable Long id) {
		try {
			return ResponseEntity.ok(ApiResponse.ok("Employee retrieved", employeeService.getById(id)));
		} catch (RuntimeException ex) {
			return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
		}
	}

	@GetMapping("/autocomplete")
	@PreAuthorize("principal.roleId == 1")
	public ResponseEntity<ApiResponse<List<EmployeeInfoResponseDto>>> autocomplete(@RequestParam(defaultValue = "") String keyword) {
		return ResponseEntity.ok(ApiResponse.ok("Employees", employeeService.autocomplete(keyword)));
	}

	@GetMapping("/check-staff-nrc")
	@PreAuthorize("principal.roleId == 1")
	public ResponseEntity<ApiResponse<Boolean>> checkStaffNrc(
			@RequestParam String staffNrcNo,
			@RequestParam(required = false) Long excludeId) {
		try {
			boolean exists = employeeService.existsByStaffNrcNo(staffNrcNo, excludeId);
			return ResponseEntity.ok(ApiResponse.ok("NRC check completed", exists));
		} catch (RuntimeException ex) {
			return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
		}
	}
}
