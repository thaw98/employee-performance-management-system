package com.epms.backend.controller;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

class EmployeeExportAccessTest {

    @Test
    void exportEmployeesAllowsHrManagersAndAuditRole() throws NoSuchMethodException {
        Method exportMethod = EmployeeController.class.getDeclaredMethod("exportEmployees");
        PreAuthorize preAuthorize = exportMethod.getAnnotation(PreAuthorize.class);

        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value())
                .contains("hasAnyRole('HR', 'MANAGER', 'DEPARTMENT_HEAD', 'TEAM_HEAD', 'AUDIT')")
                .contains("principal.roleId == 5");
        assertThat(exportMethod.getAnnotation(GetMapping.class).value()).contains("/export");
    }
}
