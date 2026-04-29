package com.epms.backend.controller;

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
import com.epms.backend.dto.levelcode.CreateLevelCodeRequest;
import com.epms.backend.dto.levelcode.LevelCodeDetailDto;
import com.epms.backend.dto.levelcode.LevelCodeDto;
import com.epms.backend.dto.levelcode.LevelCodeListResponse;
import com.epms.backend.dto.levelcode.LevelCodePositionDto;
import com.epms.backend.dto.levelcode.UpdateLevelCodeRequest;
import com.epms.backend.dto.levelcode.UpdatePositionRoleRequest;
import com.epms.backend.service.LevelCodeService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/level-codes")
@RequiredArgsConstructor
@PreAuthorize("hasRole('HR')")
public class LevelCodeController {

	private final LevelCodeService levelCodeService;

	@GetMapping
	public ResponseEntity<ApiResponse<LevelCodeListResponse>> getAllLevelCodes() {
		return ResponseEntity.ok(ApiResponse.ok("Level codes fetched successfully.",
				levelCodeService.getAllLevelCodes()));
	}

	@GetMapping("/{id}")
	public ResponseEntity<ApiResponse<LevelCodeDetailDto>> getLevelCodeDetail(@PathVariable Long id) {
		return ResponseEntity.ok(ApiResponse.ok("Level code detail fetched successfully.",
				levelCodeService.getLevelCodeDetail(id)));
	}

	@PostMapping
	public ResponseEntity<ApiResponse<LevelCodeDto>> createLevelCode(
			@Valid @RequestBody CreateLevelCodeRequest request) {
		return ResponseEntity.ok(ApiResponse.ok("Level code created successfully.",
				levelCodeService.createLevelCode(request)));
	}

	@PutMapping("/{id}")
	public ResponseEntity<ApiResponse<LevelCodeDto>> updateLevelCode(@PathVariable Long id,
			@Valid @RequestBody UpdateLevelCodeRequest request) {
		return ResponseEntity.ok(ApiResponse.ok("Level code updated successfully.",
				levelCodeService.updateLevelCode(id, request)));
	}

	@PatchMapping("/positions/{positionId}/role")
	public ResponseEntity<ApiResponse<LevelCodePositionDto>> updatePositionRole(@PathVariable Long positionId,
			@Valid @RequestBody UpdatePositionRoleRequest request) {
		return ResponseEntity.ok(ApiResponse.ok("Position role updated successfully.",
				levelCodeService.updatePositionRole(positionId, request)));
	}
}
