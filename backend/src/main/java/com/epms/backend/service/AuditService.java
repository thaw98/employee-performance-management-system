package com.epms.backend.service;

import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.entity.AuditLog;
import com.epms.backend.repository.AuditLogRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuditService {

	private final AuditLogRepository auditLogRepository;

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
}
