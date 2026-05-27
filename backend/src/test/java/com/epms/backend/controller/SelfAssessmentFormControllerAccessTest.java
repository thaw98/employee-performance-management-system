package com.epms.backend.controller;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;

class SelfAssessmentFormControllerAccessTest {

    @Test
    void scoreRecordsAllowsAuditReadAccess() throws NoSuchMethodException {
        PreAuthorize preAuthorize = SelfAssessmentFormController.class
                .getDeclaredMethod("getScoreRecords", com.epms.backend.security.UserPrincipal.class)
                .getAnnotation(PreAuthorize.class);

        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value()).contains("principal.roleId == 5");
    }

    @Test
    void formDetailAllowsAuditReadAccess() throws NoSuchMethodException {
        PreAuthorize preAuthorize = SelfAssessmentFormController.class
                .getDeclaredMethod("getFormById", Long.class, com.epms.backend.security.UserPrincipal.class)
                .getAnnotation(PreAuthorize.class);

        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value()).contains("principal.roleId == 5");
    }

    @Test
    void scoreRecordsExportAllowsAuditReadAccess() {
        boolean exportAllowsAudit = Arrays.stream(SelfAssessmentFormController.class.getDeclaredMethods())
                .filter(method -> method.getName().equals("exportScoreRecordsPdf"))
                .map(method -> method.getAnnotation(PreAuthorize.class))
                .anyMatch(preAuthorize -> preAuthorize != null
                        && preAuthorize.value().contains("principal.roleId == 5"));

        assertThat(exportAllowsAudit).isTrue();
    }
}
