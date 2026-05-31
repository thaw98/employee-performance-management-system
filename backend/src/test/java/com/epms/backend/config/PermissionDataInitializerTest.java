package com.epms.backend.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import com.epms.backend.entity.PermissionAction;
import com.epms.backend.entity.Position;
import com.epms.backend.entity.PositionPermission;
import com.epms.backend.entity.Role;
import com.epms.backend.repository.PermissionActionRepository;
import com.epms.backend.repository.PermissionModuleRepository;
import com.epms.backend.repository.PositionPermissionRepository;
import com.epms.backend.repository.PositionRepository;

class PermissionDataInitializerTest {

    @Test
    void createsMissingRowsWithoutOverwritingExistingRows() {
        PermissionModuleRepository moduleRepository = org.mockito.Mockito.mock(PermissionModuleRepository.class);
        PermissionActionRepository actionRepository = org.mockito.Mockito.mock(PermissionActionRepository.class);
        PositionRepository positionRepository = org.mockito.Mockito.mock(PositionRepository.class);
        PositionPermissionRepository positionPermissionRepository = org.mockito.Mockito.mock(PositionPermissionRepository.class);

        when(moduleRepository.existsByModuleKey(anyString())).thenReturn(true);
        when(actionRepository.existsByModuleKeyAndActionKey(anyString(), anyString())).thenReturn(true);

        PermissionAction existingAction = action("KPI", "view");
        PermissionAction missingAction = action("KPI", "manage");
        when(actionRepository.findAllByOrderBySortOrderAsc()).thenReturn(List.of(existingAction, missingAction));

        Position hrPosition = position(1L, 1L);
        when(positionRepository.findAll()).thenReturn(List.of(hrPosition));

        PositionPermission existing = new PositionPermission();
        existing.setPosition(hrPosition);
        existing.setModuleKey("KPI");
        existing.setActionKey("view");
        existing.setAllowed(false);
        when(positionPermissionRepository.findByPositionIdOrderByModuleKeyAscActionKeyAsc(1L))
                .thenReturn(List.of(existing));

        PermissionDataInitializer initializer = new PermissionDataInitializer(
                moduleRepository,
                actionRepository,
                positionRepository,
                positionPermissionRepository);

        initializer.run();

        ArgumentCaptor<PositionPermission> captor = ArgumentCaptor.forClass(PositionPermission.class);
        verify(positionPermissionRepository).save(captor.capture());
        PositionPermission created = captor.getValue();
        assertThat(created.getModuleKey()).isEqualTo("KPI");
        assertThat(created.getActionKey()).isEqualTo("manage");
        assertThat(created.isAllowed()).isTrue();
        assertThat(existing.isAllowed()).isFalse();
    }

    @Test
    void unmappedPositionsDefaultDenied() {
        PermissionModuleRepository moduleRepository = org.mockito.Mockito.mock(PermissionModuleRepository.class);
        PermissionActionRepository actionRepository = org.mockito.Mockito.mock(PermissionActionRepository.class);
        PositionRepository positionRepository = org.mockito.Mockito.mock(PositionRepository.class);
        PositionPermissionRepository positionPermissionRepository = org.mockito.Mockito.mock(PositionPermissionRepository.class);

        when(moduleRepository.existsByModuleKey(anyString())).thenReturn(true);
        when(actionRepository.existsByModuleKeyAndActionKey(anyString(), anyString())).thenReturn(true);
        when(actionRepository.findAllByOrderBySortOrderAsc()).thenReturn(List.of(action("KPI", "view")));

        Position customPosition = position(2L, 99L);
        when(positionRepository.findAll()).thenReturn(List.of(customPosition));
        when(positionPermissionRepository.findByPositionIdOrderByModuleKeyAscActionKeyAsc(2L)).thenReturn(List.of());

        PermissionDataInitializer initializer = new PermissionDataInitializer(
                moduleRepository,
                actionRepository,
                positionRepository,
                positionPermissionRepository);

        initializer.run();

        ArgumentCaptor<PositionPermission> captor = ArgumentCaptor.forClass(PositionPermission.class);
        verify(positionPermissionRepository).save(captor.capture());
        assertThat(captor.getValue().isAllowed()).isFalse();
    }

    @Test
    void inactivePositionsAreSkipped() {
        PermissionModuleRepository moduleRepository = org.mockito.Mockito.mock(PermissionModuleRepository.class);
        PermissionActionRepository actionRepository = org.mockito.Mockito.mock(PermissionActionRepository.class);
        PositionRepository positionRepository = org.mockito.Mockito.mock(PositionRepository.class);
        PositionPermissionRepository positionPermissionRepository = org.mockito.Mockito.mock(PositionPermissionRepository.class);

        when(moduleRepository.existsByModuleKey(anyString())).thenReturn(true);
        when(actionRepository.existsByModuleKeyAndActionKey(anyString(), anyString())).thenReturn(true);
        when(actionRepository.findAllByOrderBySortOrderAsc()).thenReturn(List.of(action("KPI", "view")));

        Position inactivePosition = position(3L, 5L);
        inactivePosition.setStatus("INACTIVE");
        when(positionRepository.findAll()).thenReturn(List.of(inactivePosition));

        PermissionDataInitializer initializer = new PermissionDataInitializer(
                moduleRepository,
                actionRepository,
                positionRepository,
                positionPermissionRepository);

        initializer.run();

        verify(positionPermissionRepository, never()).save(org.mockito.Mockito.any(PositionPermission.class));
    }

    private static PermissionAction action(String moduleKey, String actionKey) {
        PermissionAction action = new PermissionAction();
        action.setModuleKey(moduleKey);
        action.setActionKey(actionKey);
        return action;
    }

    private static Position position(Long positionId, Long roleId) {
        Role role = new Role();
        role.setId(roleId);
        Position position = new Position();
        position.setId(positionId);
        position.setRole(role);
        position.setStatus("ACTIVE");
        return position;
    }
}
