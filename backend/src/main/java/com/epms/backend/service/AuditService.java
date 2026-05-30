package com.epms.backend.service;

import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.entity.AuditLog;
import com.epms.backend.audit.AuditTargetType;
import com.epms.backend.dto.AuditLogDto;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.ReviewCycle;
import com.epms.backend.entity.SelfAssessmentForm;
import com.epms.backend.entity.SelfAssessmentFormTemplate;
import com.epms.backend.repository.AuditLogRepository;
import com.epms.backend.repository.SelfAssessmentFormRepository;
import com.epms.backend.repository.SelfAssessmentFormTemplateRepository;
import com.epms.backend.repository.UserRepository;

import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuditService {

	private final AuditLogRepository auditLogRepository;
	private final UserRepository userRepository;
	private final SelfAssessmentFormRepository selfAssessmentFormRepository;
	private final SelfAssessmentFormTemplateRepository selfAssessmentFormTemplateRepository;

	@Transactional(propagation = Propagation.MANDATORY)
	public void record(String actionType, String targetType, Long targetId, Long performedByUserId,
			Long performedByRoleId, String description, String metadataJson) {
		record(actionType, targetType, targetId, performedByUserId, performedByRoleId, description, metadataJson, null, null);
	}

	@Transactional(propagation = Propagation.MANDATORY)
	public void record(String actionType, String targetType, Long targetId, Long performedByUserId,
			Long performedByRoleId, String description, String metadataJson, String beforeData, String afterData) {
		AuditLog log = new AuditLog();
		log.setActionType(actionType);
		log.setTargetType(targetType);
		log.setTargetId(targetId);
		log.setPerformedByUserId(performedByUserId);
		log.setPerformedByRoleId(performedByRoleId);
		log.setDescription(description);
		log.setMetadataJson(metadataJson);
		log.setBeforeData(beforeData);
		log.setAfterData(afterData);
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

	@Transactional(readOnly = true)
	public List<AuditLogDto> getSelfAssessmentAuditLogs() {
		List<String> selfAssessmentTargetTypes = List.of(
				AuditTargetType.SELF_ASSESSMENT_FORM,
				AuditTargetType.SELF_ASSESSMENT_FORM_TEMPLATE);
		return auditLogRepository.findByTargetTypeInOrderByCreatedAtDesc(selfAssessmentTargetTypes)
				.stream()
				.map(this::convertToSelfAssessmentDto)
				.collect(Collectors.toList());
	}

	public List<AuditLogDto> getAllAuditLogs() {
		return auditLogRepository.findAllByOrderByCreatedAtDesc()
				.stream()
				.map(this::convertToDto)
				.collect(Collectors.toList());
	}

	public List<AuditLogDto> getLogsByTargetType(String targetType) {
		return auditLogRepository.findByTargetTypeInOrderByCreatedAtDesc(List.of(targetType))
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

	private AuditLogDto convertToSelfAssessmentDto(AuditLog log) {
		AuditLogDto dto = convertToDto(log);
		if (AuditTargetType.SELF_ASSESSMENT_FORM.equals(log.getTargetType()) && log.getTargetId() != null) {
			selfAssessmentFormRepository.findById(log.getTargetId()).ifPresent(form -> enrichWithForm(dto, form));
		} else if (AuditTargetType.SELF_ASSESSMENT_FORM_TEMPLATE.equals(log.getTargetType()) && log.getTargetId() != null) {
			selfAssessmentFormTemplateRepository.findById(log.getTargetId())
					.ifPresent(template -> enrichWithTemplate(dto, template));
		}
		return dto;
	}

	private void enrichWithForm(AuditLogDto dto, SelfAssessmentForm form) {
		Employee employee = form.getEmployee();
		if (employee != null) {
			dto.setEmployeeDbId(employee.getId());
			dto.setEmployeeId(employee.getEmployeeId());
			dto.setEmployeeName(employee.getEmployeeName());
		}

		SelfAssessmentFormTemplate template = form.getTemplate();
		if (template != null) {
			dto.setFormTitle(template.getTitle());
			dto.setTemplateTitle(template.getTitle());
		}

		if (form.getStatus() != null) {
			dto.setFormStatus(form.getStatus().name());
		}

		ReviewCycle cycle = form.getCycle();
		if (cycle != null) {
			dto.setCycleId(cycle.getId());
			dto.setCycleName(cycle.getName());
		}
	}

	private void enrichWithTemplate(AuditLogDto dto, SelfAssessmentFormTemplate template) {
		dto.setTemplateTitle(template.getTitle());
		ReviewCycle cycle = template.getReviewCycle();
		if (cycle != null) {
			dto.setCycleId(cycle.getId());
			dto.setCycleName(cycle.getName());
		}
	}
}
