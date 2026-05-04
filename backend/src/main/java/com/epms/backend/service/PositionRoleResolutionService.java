package com.epms.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.entity.Position;
import com.epms.backend.entity.Role;
import com.epms.backend.repository.PositionRepository;

import lombok.RequiredArgsConstructor;

/**
 * Derives {@link Role} for a user account from a {@link Position}'s {@code role_id}. Level code is
 * never used for role assignment.
 */
@Service
@RequiredArgsConstructor
public class PositionRoleResolutionService {

	private final PositionRepository positionRepository;

	/**
	 * Loads the position and returns the role after validating existence, active status, and
	 * non-null position role mapping.
	 */
	@Transactional(readOnly = true)
	public Role resolveRoleFromPositionId(Long positionId) {
		Position position = positionRepository.findByIdWithLevelCodeAndRole(positionId)
				.orElseThrow(() -> new IllegalArgumentException("Selected position does not exist."));
		return resolveRoleFromLoadedPosition(position);
	}

	/**
	 * Validates and returns the role for an already-loaded position (e.g. after a join fetch).
	 */
	public Role resolveRoleFromLoadedPosition(Position position) {
		if (!isActivePosition(position)) {
			throw new IllegalArgumentException("Selected position is inactive and cannot be assigned.");
		}
		if (position.getRole() == null) {
			throw new IllegalArgumentException("Selected position has no linked role.");
		}
		return position.getRole();
	}

	static boolean isActivePosition(Position p) {
		String s = p.getStatus();
		if (s == null || s.isBlank()) {
			return true;
		}
		return "active".equalsIgnoreCase(s.trim());
	}
}
