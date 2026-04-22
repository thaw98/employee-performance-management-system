package com.epms.backend.controller;

import java.util.Comparator;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.hr.DepartmentOptionDto;
import com.epms.backend.entity.Department;
import com.epms.backend.repository.DepartmentRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('HR')")
public class DepartmentRestController {

	private final DepartmentRepository departmentRepository;

	@GetMapping
	public ResponseEntity<ApiResponse<List<DepartmentOptionDto>>> listActive() {
		List<DepartmentOptionDto> rows = departmentRepository.findAll().stream()
				.filter(this::isActive)
				.map(d -> new DepartmentOptionDto(d.getId(), d.getName()))
				.sorted(Comparator.comparing(DepartmentOptionDto::getDepartmentName, String.CASE_INSENSITIVE_ORDER))
				.toList();
		return ResponseEntity.ok(ApiResponse.ok("Departments", rows));
	}

	private boolean isActive(Department d) {
		String s = d.getStatus();
		if (s == null || s.isBlank()) {
			return true;
		}
		return "active".equalsIgnoreCase(s.trim());
	}
}
