package com.epms.backend.service;

import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.entity.AuditLog;
import com.epms.backend.entity.User;
import com.epms.backend.audit.AuditTargetType;
import com.epms.backend.dto.AuditLogDto;
import com.epms.backend.repository.AuditLogRepository;
import com.epms.backend.repository.UserRepository;

import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuditService {

	private final AuditLogRepository auditLogRepository;
	private final UserRepository userRepository;

	@Transactional(propagation = Propagation.MANDATORY)
	public void record(String actionType, String targetType, Long targetId, Long performedByUserId,
			Long performedByRoleId, String description, String metadataJson) {
		AuditLog log = new AuditLog();
		log.setActionType(actionType);
		log.setTargetType(targetType);
		log.setTargetId(targetId);
		log.setPerformedByUserId(performedByUserId);
		log.setPerformedByRoleId(performedByRoleId);
		log.setDescription(description);
		log.setMetadataJson(metadataJson);
		log.setCreatedAt(Instant.now());
		auditLogRepository.save(log);
	}

	public List<AuditLogDto> getKpiAuditLogs() {
		List<String> kpiTargetTypes = List.of(
				AuditTargetType.EMPLOYEE_KPI,
				AuditTargetType.POSITION_KPI,
				AuditTargetType.DEPARTMENT_KPI);
		return auditLogRepository.findByTargetTypeInOrderByCreatedAtDesc(kpiTargetTypes)
				.stream()
				.map(this::convertToDto)
				.collect(Collectors.toList());
	}

	public List<AuditLogDto> getAllAuditLogs() {
		return auditLogRepository.findAllByOrderByCreatedAtDesc()
				.stream()
				.map(this::convertToDto)
				.collect(Collectors.toList());
	}

	private AuditLogDto convertToDto(AuditLog log) {
		String userName = "System";
		if (log.getPerformedByUserId() != null) {
			userName = userRepository.findById(log.getPerformedByUserId())
					.map(u -> u.getEmployee() != null ? u.getEmployee().getEmployeeName() : u.getEmail())
					.orElse("Unknown User");
		}

		return AuditLogDto.builder()
				.id(log.getId())
				.actionType(log.getActionType())
				.targetType(log.getTargetType())
				.targetId(log.getTargetId())
				.performedByUserId(log.getPerformedByUserId())
				.performedByUserName(userName)
				.description(log.getDescription())
				.metadataJson(log.getMetadataJson())
				.beforeData(log.getBeforeData())
				.afterData(log.getAfterData())
				.createdAt(log.getCreatedAt())
				.build();
	}
}
