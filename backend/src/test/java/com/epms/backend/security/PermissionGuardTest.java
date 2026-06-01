package com.epms.backend.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import com.epms.backend.entity.Employee;
import com.epms.backend.entity.EmployeePermission;
import com.epms.backend.entity.Position;
import com.epms.backend.entity.PositionPermission;
import com.epms.backend.entity.Role;
import com.epms.backend.entity.User;
import com.epms.backend.repository.EmployeePermissionRepository;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.service.PermissionService;

@ExtendWith(MockitoExtension.class)
class PermissionGuardTest {

    @Mock
    private PermissionService permissionService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private EmployeePermissionRepository employeePermissionRepository;
    @Mock
    private SecurityContext securityContext;
    @Mock
    private Authentication authentication;

    @InjectMocks
    private PermissionGuard permissionGuard;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
    }

    @Test
    void auditRoleAlwaysReturnsTrue() {
        when(authentication.getName()).thenReturn("99");
        User user = new User();
        Role auditRole = new Role();
        auditRole.setId(5L);
        user.setRole(auditRole);
        when(userRepository.findById(99L)).thenReturn(Optional.of(user));

        assertThat(permissionGuard.has("KPI", "view")).isTrue();
    }

    @Test
    void employeeAllowOverrideDoesNotGrantAccessWhenPositionDenies() {
        when(authentication.getName()).thenReturn("99");
        Position position = new Position();
        position.setId(10L);
        Employee employee = new Employee();
        employee.setId(1L);
        employee.setPosition(position);
        Role role = new Role();
        role.setId(4L);
        User user = new User();
        user.setRole(role);
        user.setEmployee(employee);

        when(userRepository.findById(99L)).thenReturn(Optional.of(user));

        EmployeePermission override = new EmployeePermission();
        override.setAllowed(true);
        when(employeePermissionRepository.findByEmployeeIdAndModuleKeyAndActionKey(1L, "KPI", "view"))
                .thenReturn(Optional.of(override));
        when(permissionService.hasPermission(10L, "KPI", "view")).thenReturn(false);

        assertThat(permissionGuard.has("KPI", "view")).isFalse();
    }

    @Test
    void bothPositionAndEmployeeAllowGrantsAccess() {
        when(authentication.getName()).thenReturn("99");
        Position position = new Position();
        position.setId(10L);
        Employee employee = new Employee();
        employee.setId(1L);
        employee.setPosition(position);
        Role role = new Role();
        role.setId(4L);
        User user = new User();
        user.setRole(role);
        user.setEmployee(employee);

        when(userRepository.findById(99L)).thenReturn(Optional.of(user));

        EmployeePermission override = new EmployeePermission();
        override.setAllowed(true);
        when(employeePermissionRepository.findByEmployeeIdAndModuleKeyAndActionKey(1L, "CONTINUOUS_FEEDBACK", "create"))
                .thenReturn(Optional.of(override));
        when(permissionService.hasPermission(10L, "CONTINUOUS_FEEDBACK", "create")).thenReturn(true);

        assertThat(permissionGuard.has("CONTINUOUS_FEEDBACK", "create")).isTrue();
    }

    @Test
    void employeeDenyOverrideBlocksAccessWhenPositionAllows() {
        when(authentication.getName()).thenReturn("99");
        Position position = new Position();
        position.setId(10L);
        Employee employee = new Employee();
        employee.setId(1L);
        employee.setPosition(position);
        Role role = new Role();
        role.setId(4L);
        User user = new User();
        user.setRole(role);
        user.setEmployee(employee);

        when(userRepository.findById(99L)).thenReturn(Optional.of(user));

        EmployeePermission override = new EmployeePermission();
        override.setAllowed(false);
        when(employeePermissionRepository.findByEmployeeIdAndModuleKeyAndActionKey(1L, "KPI", "view"))
                .thenReturn(Optional.of(override));

        assertThat(permissionGuard.has("KPI", "view")).isFalse();
    }

    @Test
    void noEmployeeOverrideDelegatesToPositionPermission() {
        when(authentication.getName()).thenReturn("99");
        Position position = new Position();
        position.setId(10L);
        Employee employee = new Employee();
        employee.setId(1L);
        employee.setPosition(position);
        Role role = new Role();
        role.setId(4L);
        User user = new User();
        user.setRole(role);
        user.setEmployee(employee);

        when(userRepository.findById(99L)).thenReturn(Optional.of(user));
        when(employeePermissionRepository.findByEmployeeIdAndModuleKeyAndActionKey(1L, "KPI", "view"))
                .thenReturn(Optional.empty());
        when(permissionService.hasPermission(10L, "KPI", "view")).thenReturn(true);

        assertThat(permissionGuard.has("KPI", "view")).isTrue();
    }

    @Test
    void userWithoutEmployeeRecordReturnsFalse() {
        when(authentication.getName()).thenReturn("99");
        Role role = new Role();
        role.setId(4L);
        User user = new User();
        user.setRole(role);
        user.setEmployee(null);

        when(userRepository.findById(99L)).thenReturn(Optional.of(user));

        assertThat(permissionGuard.has("KPI", "view")).isFalse();
    }
}
