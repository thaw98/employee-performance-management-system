package com.epms.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.epms.backend.entity.Employee;
import com.epms.backend.entity.Position;
import com.epms.backend.entity.PositionPermission;
import com.epms.backend.entity.Role;
import com.epms.backend.entity.User;
import com.epms.backend.repository.PermissionActionRepository;
import com.epms.backend.repository.PermissionModuleRepository;
import com.epms.backend.repository.PositionPermissionRepository;
import com.epms.backend.repository.PositionRepository;
import com.epms.backend.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class PermissionServiceTest {

    @Mock
    private PermissionModuleRepository moduleRepository;
    @Mock
    private PermissionActionRepository actionRepository;
    @Mock
    private PositionPermissionRepository positionPermissionRepository;
    @Mock
    private PositionRepository positionRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private PermissionService permissionService;

    @Test
    void missingPermissionRowDeniesAccess() {
        when(positionPermissionRepository.findByPositionIdAndModuleKeyAndActionKey(10L, "KPI", "view"))
                .thenReturn(Optional.empty());

        assertThat(permissionService.hasPermission(10L, "KPI", "view")).isFalse();
    }

    @Test
    void explicitAllowPermitsAccess() {
        PositionPermission permission = new PositionPermission();
        permission.setAllowed(true);
        when(positionPermissionRepository.findByPositionIdAndModuleKeyAndActionKey(10L, "KPI", "view"))
                .thenReturn(Optional.of(permission));

        assertThat(permissionService.hasPermission(10L, "KPI", "view")).isTrue();
    }

    @Test
    void explicitDenyBlocksAccess() {
        PositionPermission permission = new PositionPermission();
        permission.setAllowed(false);
        when(positionPermissionRepository.findByPositionIdAndModuleKeyAndActionKey(10L, "KPI", "view"))
                .thenReturn(Optional.of(permission));

        assertThat(permissionService.hasPermission(10L, "KPI", "view")).isFalse();
    }

    @Test
    void auditRoleAlwaysPassesForUserPermissionCheck() {
        User user = new User();
        Role auditRole = new Role();
        auditRole.setId(5L);
        user.setRole(auditRole);
        when(userRepository.findById(99L)).thenReturn(Optional.of(user));

        assertThat(permissionService.hasPermissionForUserId(99L, "KPI", "configure")).isTrue();
    }

    @Test
    void nonAuditUserWithoutPositionDeniesForUserPermissionCheck() {
        User user = new User();
        Role employeeRole = new Role();
        employeeRole.setId(4L);
        user.setRole(employeeRole);
        user.setEmployee(new Employee());
        when(userRepository.findById(99L)).thenReturn(Optional.of(user));

        assertThat(permissionService.hasPermissionForUserId(99L, "KPI", "view")).isFalse();
    }

    @Test
    void nonAuditUserWithExplicitAllowPassesForUserPermissionCheck() {
        Position position = new Position();
        position.setId(10L);
        Employee employee = new Employee();
        employee.setPosition(position);
        Role employeeRole = new Role();
        employeeRole.setId(4L);
        User user = new User();
        user.setRole(employeeRole);
        user.setEmployee(employee);
        PositionPermission permission = new PositionPermission();
        permission.setAllowed(true);

        when(userRepository.findById(99L)).thenReturn(Optional.of(user));
        when(positionPermissionRepository.findByPositionIdAndModuleKeyAndActionKey(10L, "KPI", "view"))
                .thenReturn(Optional.of(permission));

        assertThat(permissionService.hasPermissionForUserId(99L, "KPI", "view")).isTrue();
    }
}
