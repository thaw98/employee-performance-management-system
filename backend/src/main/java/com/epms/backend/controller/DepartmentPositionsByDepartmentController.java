package com.epms.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.mapping.DepartmentPositionMappingDto;
import com.epms.backend.service.DepartmentPositionMappingService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
public class DepartmentPositionsByDepartmentController {
	private final DepartmentPositionMappingService mappingService;

	@GetMapping("/{departmentId}/positions")
	@PreAuthorize("hasRole('HR')")
	public ResponseEntity<ApiResponse<List<DepartmentPositionMappingDto>>> getByDepartment(@PathVariable Long departmentId) {
		return ResponseEntity.ok(ApiResponse.ok("Positions fetched successfully.",
				mappingService.getMappingsByDepartment(departmentId)));
	}
}
