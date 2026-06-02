package com.epms.backend.controller;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

import static org.assertj.core.api.Assertions.assertThat;

class FeedbackManagementControllerImportTest {

    @Test
    void controllerClassRequiresHr() {
        PreAuthorize preAuthorize = FeedbackManagementController.class
                .getAnnotation(PreAuthorize.class);

        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value()).contains("hasRole('HR')");
    }

    @Test
    void importEndpointsAreCoveredByClassLevelHrAnnotation() {
        PreAuthorize classAnnotation = FeedbackManagementController.class
                .getAnnotation(PreAuthorize.class);
        assertThat(classAnnotation).isNotNull();
        assertThat(classAnnotation.value()).contains("hasRole('HR')");

        boolean hasDownloadMethod = false;
        boolean hasValidateMethod = false;

        for (var method : FeedbackManagementController.class.getDeclaredMethods()) {
            if (method.getName().equals("downloadImportTemplate")) {
                hasDownloadMethod = true;
            }
            if (method.getName().equals("validateImport")) {
                hasValidateMethod = true;
            }
        }

        assertThat(hasDownloadMethod).isTrue();
        assertThat(hasValidateMethod).isTrue();
    }
}
