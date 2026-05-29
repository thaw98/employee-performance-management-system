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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.position.AssignedDepartmentDto;
import com.epms.backend.dto.position.CreatePositionRequest;
import com.epms.backend.dto.position.PositionDto;
import com.epms.backend.dto.position.PositionListResponse;
import com.epms.backend.dto.position.UpdatePositionRequest;
import com.epms.backend.service.PositionService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/positions")
@RequiredArgsConstructor
public class PositionController {

	private final PositionService positionService;

	@GetMapping
	@PreAuthorize("hasAnyRole('HR', 'AUDIT') or principal.roleId == 5")
	public ResponseEntity<ApiResponse<PositionListResponse>> getPositions(
			@RequestParam(required = false) Integer page,
			@RequestParam(required = false) Integer size,
			@RequestParam(required = false) String sortBy,
			@RequestParam(required = false) String sortDir,
			@RequestParam(required = false) String search,
			@RequestParam(required = false) String positionName,
			@RequestParam(required = false) Long roleId,
			@RequestParam(required = false) Long levelCodeId) {
		return ResponseEntity.ok(ApiResponse.ok("Positions fetched successfully.",
				positionService.getPositions(page, size, search, positionName, roleId, levelCodeId, sortBy, sortDir)));
	}

	@GetMapping("/{id}")
	@PreAuthorize("hasAnyRole('HR', 'AUDIT') or principal.roleId == 5")
	public ResponseEntity<ApiResponse<PositionDto>> getPositionById(@PathVariable Long id) {
		return ResponseEntity.ok(ApiResponse.ok("Position fetched successfully.", positionService.getPositionById(id)));
	}

	@GetMapping("/{id}/departments")
	@PreAuthorize("hasAnyRole('HR', 'AUDIT') or principal.roleId == 5")
	public ResponseEntity<List<AssignedDepartmentDto>> getDepartmentsByPositionId(@PathVariable Long id) {
		return ResponseEntity.ok(positionService.getDepartmentsByPositionId(id));
	}

	@PostMapping
	@PreAuthorize("hasAnyRole('HR', 'AUDIT') or principal.roleId == 5")
	public ResponseEntity<ApiResponse<PositionDto>> createPosition(@Valid @RequestBody CreatePositionRequest request) {
		return ResponseEntity.ok(ApiResponse.ok("Position created successfully.", positionService.createPosition(request)));
	}

	@PutMapping("/{id}")
	@PreAuthorize("hasAnyRole('HR', 'AUDIT') or principal.roleId == 5")
	public ResponseEntity<ApiResponse<PositionDto>> updatePosition(@PathVariable Long id,
			@Valid @RequestBody UpdatePositionRequest request) {
		return ResponseEntity.ok(ApiResponse.ok("Position updated successfully.", positionService.updatePosition(id, request)));
	}

	@PatchMapping("/{id}/status")
	@PreAuthorize("hasAnyRole('HR', 'AUDIT') or principal.roleId == 5")
	public ResponseEntity<ApiResponse<PositionDto>> toggleStatus(@PathVariable Long id) {
		return ResponseEntity.ok(ApiResponse.ok("Position status updated successfully.", positionService.toggleStatus(id)));
	}
}
