package com.epms.backend.controller;

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
import com.epms.backend.dto.hr.DepartmentCreateDto;
import com.epms.backend.dto.hr.DepartmentDto;
import com.epms.backend.dto.hr.DepartmentUpdateDto;
import com.epms.backend.service.DepartmentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('HR')")
public class DepartmentRestController {

	private final DepartmentService departmentService;

	@GetMapping
	public ResponseEntity<ApiResponse<List<DepartmentDto>>> listActive() {
		List<DepartmentDto> rows = departmentService.getAllDepartments();
		return ResponseEntity.ok(ApiResponse.ok("Departments fetched successfully", rows));
	}

	@PostMapping
	public ResponseEntity<ApiResponse<DepartmentDto>> createDepartment(@Valid @RequestBody DepartmentCreateDto dto) {
		DepartmentDto created = departmentService.createDepartment(dto);
		return ResponseEntity.ok(ApiResponse.ok("Department created successfully.", created));
	}

	@PutMapping("/{id}")
	public ResponseEntity<ApiResponse<DepartmentDto>> updateDepartment(
			@PathVariable Long id,
			@Valid @RequestBody DepartmentUpdateDto dto) {
		DepartmentDto updated = departmentService.updateDepartment(id, dto);
		return ResponseEntity.ok(ApiResponse.ok("Department updated successfully.", updated));
	}

	@PatchMapping("/{id}/disband")
	public ResponseEntity<ApiResponse<DepartmentDto>> disbandDepartment(@PathVariable Long id) {
		DepartmentDto disbanded = departmentService.disbandDepartment(id);
		return ResponseEntity.ok(ApiResponse.ok("Department disbanded successfully.", disbanded));
	}
}
