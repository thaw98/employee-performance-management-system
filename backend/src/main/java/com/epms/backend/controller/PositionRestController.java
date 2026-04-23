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
import com.epms.backend.security.UserPrincipal;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.entity.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@RequestMapping("/api/positions")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('HR', 'DEPARTMENT_HEAD', 'TEAM_HEAD')")
public class PositionRestController {

	private final PositionRepository positionRepository;
	private final UserRepository userRepository;

	@GetMapping
	public ResponseEntity<ApiResponse<List<PositionOptionDto>>> byDepartment(
			@AuthenticationPrincipal UserPrincipal principal,
			@RequestParam(required = false) Long departmentId) {
		User user = userRepository.findById(principal.getId()).orElseThrow();
		boolean isHr = user.getRole() != null && "HR".equalsIgnoreCase(user.getRole().getName());
		
		Long effectiveDeptId = departmentId;
		if (!isHr) {
			if (user.getEmployee() != null && user.getEmployee().getDepartment() != null) {
				effectiveDeptId = user.getEmployee().getDepartment().getId();
			} else {
				// Manager without department? Return empty.
				return ResponseEntity.ok(ApiResponse.ok("Positions", List.of()));
			}
		}

		List<Position> positions = effectiveDeptId == null
				? positionRepository.findAll()
				: positionRepository.findByDepartmentIdOrderByNameAsc(effectiveDeptId);

		List<PositionOptionDto> rows = positions.stream()
				.filter(this::isActive)
				.map(p -> new PositionOptionDto(p.getId(), p.getName()))
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
