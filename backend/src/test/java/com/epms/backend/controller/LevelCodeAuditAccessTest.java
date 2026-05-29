package com.epms.backend.controller;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

class LevelCodeAuditAccessTest {

    @Test
    void listLevelCodesAllowsHrAndAuditReadAccess() throws NoSuchMethodException {
        Method getAll = LevelCodeController.class.getDeclaredMethod("getAllLevelCodes");
        PreAuthorize preAuthorize = getAll.getAnnotation(PreAuthorize.class);

        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value())
                .contains("hasAnyRole('HR', 'AUDIT')")
                .contains("principal.roleId == 5");
        assertThat(getAll.getAnnotation(GetMapping.class)).isNotNull();
    }

    @Test
    void getLevelCodeDetailAllowsHrAndAuditReadAccess() throws NoSuchMethodException {
        Method getById = LevelCodeController.class.getDeclaredMethod("getLevelCodeDetail", Long.class);
        PreAuthorize preAuthorize = getById.getAnnotation(PreAuthorize.class);

        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value())
                .contains("hasAnyRole('HR', 'AUDIT')")
                .contains("principal.roleId == 5");
    }

    @Test
    void createLevelCodeAllowsHrAndAuditAccess() throws NoSuchMethodException {
        Method create = LevelCodeController.class.getDeclaredMethod(
                "createLevelCode", com.epms.backend.dto.levelcode.CreateLevelCodeRequest.class);
        PreAuthorize preAuthorize = create.getAnnotation(PreAuthorize.class);

        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value())
                .contains("hasAnyRole('HR', 'AUDIT')")
                .contains("principal.roleId == 5");
        assertThat(create.getAnnotation(PostMapping.class)).isNotNull();
    }

    @Test
    void updateLevelCodeAllowsHrAndAuditAccess() throws NoSuchMethodException {
        Method update = LevelCodeController.class.getDeclaredMethod(
                "updateLevelCode", Long.class, com.epms.backend.dto.levelcode.UpdateLevelCodeRequest.class);
        PreAuthorize preAuthorize = update.getAnnotation(PreAuthorize.class);

        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value())
                .contains("hasAnyRole('HR', 'AUDIT')")
                .contains("principal.roleId == 5");
        assertThat(update.getAnnotation(PutMapping.class)).isNotNull();
    }

    @Test
    void updatePositionRoleAllowsHrAndAuditAccess() throws NoSuchMethodException {
        Method updateRole = LevelCodeController.class.getDeclaredMethod(
                "updatePositionRole",
                Long.class,
                com.epms.backend.dto.levelcode.UpdatePositionRoleRequest.class);
        PreAuthorize preAuthorize = updateRole.getAnnotation(PreAuthorize.class);

        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value())
                .contains("hasAnyRole('HR', 'AUDIT')")
                .contains("principal.roleId == 5");
        assertThat(updateRole.getAnnotation(PatchMapping.class)).isNotNull();
    }
}
