package com.epms.backend.controller;

import java.util.Comparator;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.hr.PositionOptionDto;
import com.epms.backend.entity.Position;
import com.epms.backend.repository.PositionRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/positions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('HR')")
public class PositionRestController {

	private final PositionRepository positionRepository;

	@GetMapping
	public ResponseEntity<ApiResponse<List<PositionOptionDto>>> byDepartment(@RequestParam(required = false) Long departmentId) {
		List<Position> positions = departmentId == null
				? positionRepository.findAll()
				: positionRepository.findByDepartmentIdOrderByNameAsc(departmentId);

		List<PositionOptionDto> rows = positions.stream()
				.filter(this::isActive)
				.filter(p -> departmentId == null
						|| (p.getDepartment() != null && departmentId.equals(p.getDepartment().getId())))
				.map(p -> new PositionOptionDto(
						p.getId(),
						p.getName(),
						p.getRole() != null ? p.getRole().getId() : null,
						p.getRole() != null ? p.getRole().getName() : null))
				.sorted(Comparator.comparing(PositionOptionDto::getPositionName, String.CASE_INSENSITIVE_ORDER))
				.toList();
		return ResponseEntity.ok(ApiResponse.ok("Positions", rows));
	}

	private boolean isActive(Position p) {
		String s = p.getStatus();
		if (s == null || s.isBlank()) {
			return true;
		}
		return "active".equalsIgnoreCase(s.trim());
	}
}
