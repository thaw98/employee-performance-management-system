package com.epms.backend.service;

import com.epms.backend.audit.AuditTargetType;
import com.epms.backend.dto.AuditLogDto;
import com.epms.backend.entity.AuditLog;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.ReviewCycle;
import com.epms.backend.entity.SelfAssessmentForm;
import com.epms.backend.entity.SelfAssessmentFormStatus;
import com.epms.backend.entity.SelfAssessmentFormTemplate;
import com.epms.backend.entity.User;
import com.epms.backend.repository.AuditLogRepository;
import com.epms.backend.repository.SelfAssessmentFormRepository;
import com.epms.backend.repository.SelfAssessmentFormTemplateRepository;
import com.epms.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuditServiceTest {

    private final AuditLogRepository auditLogRepository = mock(AuditLogRepository.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final SelfAssessmentFormRepository formRepository = mock(SelfAssessmentFormRepository.class);
    private final SelfAssessmentFormTemplateRepository templateRepository = mock(SelfAssessmentFormTemplateRepository.class);
    private final AuditService service = new AuditService(
            auditLogRepository,
            userRepository,
            formRepository,
            templateRepository);

    @Test
    void getSelfAssessmentAuditLogsFetchesOnlySelfAssessmentTargetTypesAndPerformerName() {
        AuditLog formLog = auditLog(1L, AuditTargetType.SELF_ASSESSMENT_FORM, 10L, 5L);
        AuditLog templateLog = auditLog(2L, AuditTargetType.SELF_ASSESSMENT_FORM_TEMPLATE, 20L, null);
        when(auditLogRepository.findByTargetTypeInOrderByCreatedAtDesc(List.of(
                AuditTargetType.SELF_ASSESSMENT_FORM,
                AuditTargetType.SELF_ASSESSMENT_FORM_TEMPLATE)))
                .thenReturn(List.of(formLog, templateLog));

        Employee performerEmployee = new Employee();
        performerEmployee.setEmployeeName("Hnin Hnin");
        User performer = new User();
        performer.setEmployee(performerEmployee);
        when(userRepository.findById(5L)).thenReturn(Optional.of(performer));

        List<AuditLogDto> result = service.getSelfAssessmentAuditLogs();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getPerformedByUserName()).isEqualTo("Hnin Hnin");
        assertThat(result.get(1).getPerformedByUserName()).isEqualTo("System");
        verify(auditLogRepository).findByTargetTypeInOrderByCreatedAtDesc(List.of(
                AuditTargetType.SELF_ASSESSMENT_FORM,
                AuditTargetType.SELF_ASSESSMENT_FORM_TEMPLATE));
    }

    @Test
    void getSelfAssessmentAuditLogsEnrichesFormContext() {
        AuditLog log = auditLog(1L, AuditTargetType.SELF_ASSESSMENT_FORM, 10L, 5L);
        when(auditLogRepository.findByTargetTypeInOrderByCreatedAtDesc(List.of(
                AuditTargetType.SELF_ASSESSMENT_FORM,
                AuditTargetType.SELF_ASSESSMENT_FORM_TEMPLATE)))
                .thenReturn(List.of(log));
        when(userRepository.findById(5L)).thenReturn(Optional.empty());

        Employee employee = new Employee();
        employee.setId(100L);
        employee.setEmployeeId("EMP-100");
        employee.setEmployeeName("Aye Aye");

        ReviewCycle cycle = new ReviewCycle();
        cycle.setId(7L);
        cycle.setName("Q2 2026");

        SelfAssessmentFormTemplate template = new SelfAssessmentFormTemplate();
        template.setId(20L);
        template.setTitle("Engineering Developer Review");

        SelfAssessmentForm form = new SelfAssessmentForm();
        form.setId(10L);
        form.setEmployee(employee);
        form.setTemplate(template);
        form.setCycle(cycle);
        form.setStatus(SelfAssessmentFormStatus.SUBMITTED);
        when(formRepository.findById(10L)).thenReturn(Optional.of(form));

        AuditLogDto dto = service.getSelfAssessmentAuditLogs().get(0);

        assertThat(dto.getEmployeeDbId()).isEqualTo(100L);
        assertThat(dto.getEmployeeId()).isEqualTo("EMP-100");
        assertThat(dto.getEmployeeName()).isEqualTo("Aye Aye");
        assertThat(dto.getFormTitle()).isEqualTo("Engineering Developer Review");
        assertThat(dto.getTemplateTitle()).isEqualTo("Engineering Developer Review");
        assertThat(dto.getFormStatus()).isEqualTo("SUBMITTED");
        assertThat(dto.getCycleId()).isEqualTo(7L);
        assertThat(dto.getCycleName()).isEqualTo("Q2 2026");
    }

    @Test
    void getSelfAssessmentAuditLogsEnrichesTemplateContext() {
        AuditLog log = auditLog(1L, AuditTargetType.SELF_ASSESSMENT_FORM_TEMPLATE, 20L, 5L);
        when(auditLogRepository.findByTargetTypeInOrderByCreatedAtDesc(List.of(
                AuditTargetType.SELF_ASSESSMENT_FORM,
                AuditTargetType.SELF_ASSESSMENT_FORM_TEMPLATE)))
                .thenReturn(List.of(log));
        when(userRepository.findById(5L)).thenReturn(Optional.empty());

        SelfAssessmentFormTemplate template = new SelfAssessmentFormTemplate();
        template.setId(20L);
        template.setTitle("Template A");
        when(templateRepository.findById(20L)).thenReturn(Optional.of(template));

        AuditLogDto dto = service.getSelfAssessmentAuditLogs().get(0);

        assertThat(dto.getTemplateTitle()).isEqualTo("Template A");
        assertThat(dto.getFormTitle()).isNull();
        verify(formRepository, never()).findById(20L);
    }

    @Test
    void getSelfAssessmentAuditLogsHandlesMissingDeletedReferences() {
        AuditLog log = auditLog(1L, AuditTargetType.SELF_ASSESSMENT_FORM, 10L, 5L);
        when(auditLogRepository.findByTargetTypeInOrderByCreatedAtDesc(List.of(
                AuditTargetType.SELF_ASSESSMENT_FORM,
                AuditTargetType.SELF_ASSESSMENT_FORM_TEMPLATE)))
                .thenReturn(List.of(log));
        when(userRepository.findById(5L)).thenReturn(Optional.empty());
        when(formRepository.findById(10L)).thenReturn(Optional.empty());

        AuditLogDto dto = service.getSelfAssessmentAuditLogs().get(0);

        assertThat(dto.getTargetType()).isEqualTo(AuditTargetType.SELF_ASSESSMENT_FORM);
        assertThat(dto.getTargetId()).isEqualTo(10L);
        assertThat(dto.getEmployeeName()).isNull();
        assertThat(dto.getFormTitle()).isNull();
    }

    private static AuditLog auditLog(Long id, String targetType, Long targetId, Long performedByUserId) {
        AuditLog log = new AuditLog();
        log.setId(id);
        log.setActionType("SELF_ASSESSMENT_FORM_SUBMITTED");
        log.setTargetType(targetType);
        log.setTargetId(targetId);
        log.setPerformedByUserId(performedByUserId);
        log.setDescription("Changed self-assessment");
        log.setCreatedAt(Instant.parse("2026-05-01T09:00:00Z"));
        return log;
    }
}
