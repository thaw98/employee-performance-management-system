package com.epms.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.mapping.CreateDepartmentPositionMappingRequest;
import com.epms.backend.dto.mapping.DepartmentPositionMappingDto;
import com.epms.backend.dto.mapping.DepartmentPositionMappingListResponse;
import com.epms.backend.dto.mapping.UpdateDepartmentPositionMappingRequest;
import com.epms.backend.service.DepartmentPositionMappingService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/department-positions")
@RequiredArgsConstructor
public class DepartmentPositionMappingController {

	private final DepartmentPositionMappingService mappingService;

	@GetMapping
	@PreAuthorize("hasRole('HR')")
	public ResponseEntity<ApiResponse<DepartmentPositionMappingListResponse>> getMappings(
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "10") int size,
			@RequestParam(defaultValue = "id") String sortBy,
			@RequestParam(defaultValue = "asc") String sortDir,
			@RequestParam(required = false) String search) {
		return ResponseEntity.ok(ApiResponse.ok("Mappings fetched successfully.",
				mappingService.getMappings(page, size, search, sortBy, sortDir)));
	}

	@GetMapping("/{id}")
	@PreAuthorize("hasRole('HR')")
	public ResponseEntity<ApiResponse<DepartmentPositionMappingDto>> getMappingById(@PathVariable Long id) {
		return ResponseEntity.ok(ApiResponse.ok("Mapping fetched successfully.", mappingService.getMappingById(id)));
	}

	@PostMapping
	@PreAuthorize("hasRole('HR')")
	public ResponseEntity<ApiResponse<DepartmentPositionMappingDto>> createMapping(
			@Valid @RequestBody CreateDepartmentPositionMappingRequest request) {
		return ResponseEntity.ok(ApiResponse.ok("Mapping created successfully.", mappingService.createMapping(request)));
	}

	@PutMapping("/{id}")
	@PreAuthorize("hasRole('HR')")
	public ResponseEntity<ApiResponse<DepartmentPositionMappingDto>> updateMapping(@PathVariable Long id,
			@Valid @RequestBody UpdateDepartmentPositionMappingRequest request) {
		return ResponseEntity.ok(ApiResponse.ok("Mapping updated successfully.", mappingService.updateMapping(id, request)));
	}

	@PatchMapping("/{id}/status")
	@PreAuthorize("hasRole('HR')")
	public ResponseEntity<ApiResponse<DepartmentPositionMappingDto>> toggleStatus(@PathVariable Long id) {
		return ResponseEntity.ok(ApiResponse.ok("Mapping status updated successfully.", mappingService.toggleStatus(id)));
	}

	@DeleteMapping("/{id}")
	@PreAuthorize("hasRole('HR')")
	public ResponseEntity<ApiResponse<Void>> deleteMapping(@PathVariable Long id) {
		mappingService.deleteMapping(id);
		return ResponseEntity.ok(ApiResponse.ok("Position removed from department.", null));
	}
}
