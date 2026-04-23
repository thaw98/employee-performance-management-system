package com.epms.backend.controller;

import java.util.Comparator;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.department.CreateDepartmentRequest;
import com.epms.backend.dto.department.DepartmentDto;
import com.epms.backend.dto.department.UpdateDepartmentRequest;
import com.epms.backend.dto.hr.DepartmentOptionDto;
import com.epms.backend.entity.Department;
import com.epms.backend.repository.DepartmentRepository;
import com.epms.backend.service.DepartmentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import com.epms.backend.security.UserPrincipal;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.entity.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
public class DepartmentRestController {

	private final DepartmentRepository departmentRepository;
	private final DepartmentService departmentService;

	@GetMapping("/options")
	@PreAuthorize("hasAnyRole('HR', 'MANAGER', 'EMPLOYEE')")
	public ResponseEntity<ApiResponse<List<DepartmentOptionDto>>> listOptions() {
		List<DepartmentOptionDto> rows = departmentRepository.findAll().stream()
				.filter(this::isActive)
				.filter(d -> isHr || (user.getEmployee() != null && user.getEmployee().getDepartment() != null && d.getId().equals(user.getEmployee().getDepartment().getId())))
				.map(d -> new DepartmentOptionDto(d.getId(), d.getName()))
				.sorted(Comparator.comparing(DepartmentOptionDto::getDepartmentName, String.CASE_INSENSITIVE_ORDER))
				.toList();
		return ResponseEntity.ok(ApiResponse.ok("Departments", rows));
	}

	@GetMapping
	@PreAuthorize("hasRole('HR')")
	public ResponseEntity<ApiResponse<List<DepartmentDto>>> getAll() {
		return ResponseEntity.ok(ApiResponse.ok("Departments fetched successfully.", departmentService.getAllDepartments()));
	}

	@PostMapping
	@PreAuthorize("hasRole('HR')")
	public ResponseEntity<ApiResponse<DepartmentDto>> create(@Valid @RequestBody CreateDepartmentRequest request) {
		return ResponseEntity.ok(ApiResponse.ok("Department created successfully.", departmentService.createDepartment(request)));
	}

	@PutMapping("/{id}")
	@PreAuthorize("hasRole('HR')")
	public ResponseEntity<ApiResponse<DepartmentDto>> update(@PathVariable Long id, @Valid @RequestBody UpdateDepartmentRequest request) {
		return ResponseEntity.ok(ApiResponse.ok("Department updated successfully.", departmentService.updateDepartment(id, request)));
	}

	@PatchMapping("/{id}/disband")
	@PreAuthorize("hasRole('HR')")
	public ResponseEntity<ApiResponse<Void>> disband(@PathVariable Long id) {
		departmentService.disbandDepartment(id);
		return ResponseEntity.ok(ApiResponse.ok("Department disbanded successfully.", null));
	}

	private boolean isActive(Department d) {
		String s = d.getStatus();
		if (s == null || s.isBlank()) {
			return true;
		}
		return "active".equalsIgnoreCase(s.trim());
	}
}

