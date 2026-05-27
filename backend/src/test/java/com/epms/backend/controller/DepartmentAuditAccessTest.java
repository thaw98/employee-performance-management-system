package com.epms.backend.controller;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

class DepartmentAuditAccessTest {

    @Test
    void listDepartmentsAllowsHrAndAuditReadAccess() throws NoSuchMethodException {
        Method getAll = DepartmentRestController.class.getDeclaredMethod("getAll");
        PreAuthorize preAuthorize = getAll.getAnnotation(PreAuthorize.class);

        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value())
                .contains("hasAnyRole('HR', 'AUDIT')")
                .contains("principal.roleId == 5");
        assertThat(getAll.getAnnotation(GetMapping.class)).isNotNull();
    }

    @Test
    void getDepartmentByIdAllowsHrAndAuditReadAccess() throws NoSuchMethodException {
        Method getById = DepartmentRestController.class.getDeclaredMethod("getById", Long.class);
        PreAuthorize preAuthorize = getById.getAnnotation(PreAuthorize.class);

        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value())
                .contains("hasAnyRole('HR', 'AUDIT')")
                .contains("principal.roleId == 5");
    }

    @Test
    void departmentPositionsAllowsAuditReadAccess() throws NoSuchMethodException {
        Method getByDepartment = DepartmentPositionsByDepartmentController.class.getDeclaredMethod(
                "getByDepartment", Long.class);
        PreAuthorize preAuthorize = getByDepartment.getAnnotation(PreAuthorize.class);

        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value())
                .contains("AUDIT")
                .contains("principal.roleId == 5");
    }

    @Test
    void managedDepartmentPositionsRequiresDepartmentHeadRoleId() throws NoSuchMethodException {
        Method getMyManagedPositions = DepartmentPositionsByDepartmentController.class.getDeclaredMethod(
                "getMyManagedPositions", com.epms.backend.security.UserPrincipal.class);
        PreAuthorize preAuthorize = getMyManagedPositions.getAnnotation(PreAuthorize.class);

        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value()).isEqualTo("principal.roleId == 2");
    }
}
