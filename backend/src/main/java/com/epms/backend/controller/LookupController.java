package com.epms.backend.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.mapping.DepartmentPositionMappingDto;
import com.epms.backend.dto.mapping.DepartmentPositionMappingOptionDto;
import com.epms.backend.entity.DepartmentPosition;
import com.epms.backend.repository.DepartmentPositionRepository;
import com.epms.backend.repository.DepartmentRepository;
import com.epms.backend.repository.LevelCodeRepository;
import com.epms.backend.repository.PositionRepository;
import com.epms.backend.repository.RoleRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/lookups")
@RequiredArgsConstructor
public class LookupController {

	private final LevelCodeRepository levelCodeRepository;
	private final RoleRepository roleRepository;
	private final DepartmentRepository departmentRepository;
	private final DepartmentPositionRepository departmentPositionRepository;
	private final PositionRepository positionRepository;

	@GetMapping("/level-codes/active")
	@PreAuthorize("hasAnyRole('HR', 'MANAGER', 'EMPLOYEE', 'DEPARTMENT_HEAD', 'TEAM_HEAD')")
	public ResponseEntity<ApiResponse<List<LevelCodeOptionDto>>> getActiveLevelCodes() {
		List<LevelCodeOptionDto> levelCodes = levelCodeRepository.findAll().stream()
				.filter(lc -> lc.getCode() != null && !lc.getCode().isBlank())
				.map(lc -> new LevelCodeOptionDto(lc.getId(), lc.getCode(), lc.getDescription()))
				.collect(Collectors.toList());
		return ResponseEntity.ok(ApiResponse.ok("Level codes fetched successfully.", levelCodes));
	}

	@GetMapping("/roles/active")
	@PreAuthorize("hasAnyRole('HR', 'MANAGER', 'EMPLOYEE', 'DEPARTMENT_HEAD', 'TEAM_HEAD')")
	public ResponseEntity<ApiResponse<List<RoleOptionDto>>> getActiveRoles() {
		List<RoleOptionDto> roles = roleRepository.findAll().stream()
				.filter(r -> r.getName() != null && !r.getName().isBlank())
				.map(r -> new RoleOptionDto(r.getId(), r.getName(), r.getDescription()))
				.collect(Collectors.toList());
		return ResponseEntity.ok(ApiResponse.ok("Roles fetched successfully.", roles));
	}

	@GetMapping("/departments/active")
	@PreAuthorize("hasAnyRole('HR', 'MANAGER', 'EMPLOYEE', 'DEPARTMENT_HEAD', 'TEAM_HEAD')")
	public ResponseEntity<ApiResponse<List<DepartmentOptionDto>>> getActiveDepartments() {
		List<DepartmentOptionDto> departments = departmentRepository.findAll().stream()
				.filter(d -> d.getStatus() == null || "active".equalsIgnoreCase(d.getStatus().trim()))
				.map(d -> new DepartmentOptionDto(d.getId(), d.getName()))
				.collect(Collectors.toList());
		return ResponseEntity.ok(ApiResponse.ok("Departments fetched successfully.", departments));
	}

	@GetMapping("/departments/{departmentId}/positions")
	@PreAuthorize("hasAnyRole('HR', 'MANAGER', 'EMPLOYEE', 'DEPARTMENT_HEAD', 'TEAM_HEAD')")
	public ResponseEntity<ApiResponse<List<DepartmentPositionMappingOptionDto>>> getPositionsByDepartment(
			@PathVariable Long departmentId) {
		List<DepartmentPosition> activeMappings = departmentPositionRepository
				.findActiveByDepartmentIdWithPosition(departmentId);
		List<DepartmentPositionMappingOptionDto> options = activeMappings.stream()
				.map(m -> DepartmentPositionMappingOptionDto.builder()
						.id(m.getId())
						.positionId(m.getPosition().getId())
						.positionName(m.getPosition().getName())
						.positionCode(m.getPosition().getCode())
						.levelCodeName(m.getPosition().getLevelCode() != null
								? m.getPosition().getLevelCode().getCode()
								: null)
						.build())
				.collect(Collectors.toList());
		return ResponseEntity.ok(ApiResponse.ok("Positions for department fetched successfully.", options));
	}

	@GetMapping("/department-positions/active")
	@PreAuthorize("hasAnyRole('HR', 'MANAGER', 'EMPLOYEE', 'DEPARTMENT_HEAD', 'TEAM_HEAD')")
	public ResponseEntity<ApiResponse<List<DepartmentPositionMappingDto>>> getAllActiveDepartmentPositions() {
		List<DepartmentPositionMappingDto> options = departmentPositionRepository.findAll().stream()
				.filter(m -> "active".equalsIgnoreCase(m.getStatus()))
				.map(m -> DepartmentPositionMappingDto.builder()
						.id(m.getId())
						.departmentId(m.getDepartment().getId())
						.departmentName(m.getDepartment().getName())
						.positionId(m.getPosition().getId())
						.positionCode(m.getPosition().getCode())
						.positionName(m.getPosition().getName())
						.levelCodeId(m.getPosition().getLevelCode() != null ? m.getPosition().getLevelCode().getId() : null)
						.levelCodeName(m.getPosition().getLevelCode() != null ? m.getPosition().getLevelCode().getCode() : null)
						.build())
				.collect(Collectors.toList());
		return ResponseEntity.ok(ApiResponse.ok("All active department positions fetched successfully.", options));
	}

	@GetMapping("/positions/active")
	@PreAuthorize("hasAnyRole('HR', 'MANAGER', 'EMPLOYEE', 'DEPARTMENT_HEAD', 'TEAM_HEAD')")
	public ResponseEntity<ApiResponse<List<PositionOptionDto>>> getActivePositions() {
		List<PositionOptionDto> positions = positionRepository.findByStatusIgnoreCase("ACTIVE").stream()
				.map(p -> new PositionOptionDto(p.getId(), p.getName(), p.getCode()))
				.collect(Collectors.toList());
		return ResponseEntity.ok(ApiResponse.ok("Active positions fetched successfully.", positions));
	}

	public record LevelCodeOptionDto(Long id, String code, String description) {
	}

	public record RoleOptionDto(Long id, String name, String description) {
	}

	public record DepartmentOptionDto(Long id, String name) {
	}

	public record PositionOptionDto(Long id, String name, String code) {
	}
}
