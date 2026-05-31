package com.epms.backend.controller;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;

import java.lang.reflect.Method;
import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;

class PermissionControllerAccessTest {

    @Test
    void getPermissionMatrixIsRestrictedToHrAndAudit() {
        PreAuthorize preAuthorize = getMethodAnnotation("getPermissionMatrix", PreAuthorize.class);
        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value()).isEqualTo("principal.roleId == 1 or principal.roleId == 5");
    }

    @Test
    void getPositionPermissionsIsRestrictedToHrAndAudit() {
        PreAuthorize preAuthorize = getMethodAnnotation("getPositionPermissions", PreAuthorize.class);
        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value()).isEqualTo("principal.roleId == 1 or principal.roleId == 5");
    }

    @Test
    void updatePositionPermissionsIsRestrictedToHrAndAudit() {
        PreAuthorize preAuthorize = getMethodAnnotation("updatePositionPermissions", PreAuthorize.class);
        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value()).isEqualTo("principal.roleId == 1 or principal.roleId == 5");
    }

    @Test
    void getMyPermissionsAllowsAuthenticated() {
        PreAuthorize preAuthorize = getMethodAnnotation("getMyPermissions", PreAuthorize.class);
        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value()).isEqualTo("isAuthenticated()");
    }

    @Test
    void getEmployeePermissionMatrixIsRestrictedToAuditOnly() {
        PreAuthorize preAuthorize = getMethodAnnotation("getEmployeePermissionMatrix", PreAuthorize.class);
        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value()).isEqualTo("principal.roleId == 5");
    }

    @Test
    void getEmployeeEffectivePermissionsIsRestrictedToAuditOnly() {
        PreAuthorize preAuthorize = getMethodAnnotation("getEmployeeEffectivePermissions", PreAuthorize.class);
        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value()).isEqualTo("principal.roleId == 5");
    }

    @Test
    void saveEmployeePermissionsIsRestrictedToAuditOnly() {
        PreAuthorize preAuthorize = getMethodAnnotation("saveEmployeePermissions", PreAuthorize.class);
        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value()).isEqualTo("principal.roleId == 5");
    }

    @Test
    void employeePermissionEndpointsHaveMappings() {
        Class<?> controller = PermissionController.class;

        boolean hasGetMatrix = Arrays.stream(controller.getDeclaredMethods())
                .filter(m -> m.getName().equals("getEmployeePermissionMatrix"))
                .anyMatch(m -> m.getAnnotation(GetMapping.class) != null);

        boolean hasGetEffective = Arrays.stream(controller.getDeclaredMethods())
                .filter(m -> m.getName().equals("getEmployeeEffectivePermissions"))
                .anyMatch(m -> m.getAnnotation(GetMapping.class) != null);

        boolean hasSave = Arrays.stream(controller.getDeclaredMethods())
                .filter(m -> m.getName().equals("saveEmployeePermissions"))
                .anyMatch(m -> m.getAnnotation(PutMapping.class) != null);

        assertThat(hasGetMatrix).isTrue();
        assertThat(hasGetEffective).isTrue();
        assertThat(hasSave).isTrue();
    }

    private <T extends java.lang.annotation.Annotation> T getMethodAnnotation(String methodName, Class<T> annotationClass) {
        return Arrays.stream(PermissionController.class.getDeclaredMethods())
                .filter(m -> m.getName().equals(methodName))
                .findFirst()
                .map(m -> m.getAnnotation(annotationClass))
                .orElse(null);
    }
}
