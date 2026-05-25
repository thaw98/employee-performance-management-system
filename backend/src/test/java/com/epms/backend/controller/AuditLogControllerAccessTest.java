package com.epms.backend.controller;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;

class AuditLogControllerAccessTest {

    @Test
    void auditLogControllerIsRestrictedToHrAndAuditRoles() {
        PreAuthorize preAuthorize = AuditLogController.class.getAnnotation(PreAuthorize.class);

        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value()).isEqualTo("principal.roleId == 1 or principal.roleId == 5");
    }

    @Test
    void selfAssessmentAuditLogsEndpointIsMapped() {
        boolean hasSelfAssessmentEndpoint = Arrays.stream(AuditLogController.class.getDeclaredMethods())
                .filter(method -> method.getName().equals("getSelfAssessmentLogs"))
                .map(method -> method.getAnnotation(GetMapping.class))
                .anyMatch(mapping -> mapping != null && Arrays.asList(mapping.value()).contains("/self-assessment"));

        assertThat(hasSelfAssessmentEndpoint).isTrue();
    }
}
