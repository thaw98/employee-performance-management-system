package com.epms.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.dto.hr.UserAccountRoleSyncResultDto;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.Position;
import com.epms.backend.entity.Role;
import com.epms.backend.entity.User;
import com.epms.backend.repository.PositionRepository;
import com.epms.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Aligns {@code user_account.role_id} with {@code employee.position_id -> position.role_id} for
 * existing rows. Does not run automatically on startup.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserAccountPositionRoleSyncService {

	private final UserRepository userRepository;
	private final PositionRepository positionRepository;

	@Transactional
	public UserAccountRoleSyncResultDto syncAll() {
		List<User> users = userRepository.findAll();
		int updated = 0;
		int skippedNoPosition = 0;
		int skippedPositionNotFound = 0;
		int skippedNoRole = 0;
		int unchanged = 0;
		int failed = 0;

		for (User user : users) {
			try {
				Employee employee = user.getEmployee();
				if (employee == null) {
					skippedNoPosition++;
					continue;
				}
				if (employee.getPosition() == null) {
					skippedNoPosition++;
					continue;
				}
				Long positionId = employee.getPosition().getId();
				Position position = positionRepository.findByIdWithLevelCodeAndRole(positionId)
						.orElse(null);
				if (position == null) {
					skippedPositionNotFound++;
					continue;
				}
				Role target = position.getRole();
				if (target == null) {
					skippedNoRole++;
					continue;
				}
				Role current = user.getRole();
				if (current != null && current.getId().equals(target.getId())) {
					unchanged++;
					continue;
				}
				user.setRole(target);
				userRepository.save(user);
				updated++;
			} catch (Exception ex) {
				failed++;
				log.warn("user_account.role sync failed for user id {}: {}", user.getId(), ex.getMessage());
			}
		}

		String msg = "Sync complete: updated=%d, unchanged=%d, skipped (no position)=%d, skipped (position missing)=%d, skipped (no role)=%d, failed=%d"
				.formatted(updated, unchanged, skippedNoPosition, skippedPositionNotFound, skippedNoRole, failed);
		log.info(msg);
		return new UserAccountRoleSyncResultDto(updated, skippedNoPosition, skippedPositionNotFound, skippedNoRole,
				unchanged, failed, msg);
	}
}
