package com.epms.backend.security;

import java.util.Optional;
import java.util.Set;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.epms.backend.entity.EmployeePermission;
import com.epms.backend.entity.User;
import com.epms.backend.repository.EmployeePermissionRepository;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.service.PermissionService;

import lombok.RequiredArgsConstructor;

@Component("permissionGuard")
@RequiredArgsConstructor
public class PermissionGuard {

    private static final long HR_ROLE_ID = 1L;
    private static final long AUDIT_ROLE_ID = 5L;

    private final PermissionService permissionService;
    private final UserRepository userRepository;
    private final EmployeePermissionRepository employeePermissionRepository;

    public boolean has(String moduleKey, String actionKey) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }

        String username = auth.getName();
        Long userId;
        try {
            userId = Long.parseLong(username);
        } catch (NumberFormatException e) {
            return false;
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return false;
        }

        if (user.getRole() != null && user.getRole().getId() != null) {
            Long roleId = user.getRole().getId();
            if (roleId == AUDIT_ROLE_ID) {
                if ("CONTINUOUS_FEEDBACK".equals(moduleKey) && "create_pip".equals(actionKey)) {
                    return false;
                }
                return true;
            }
            if (roleId == HR_ROLE_ID && user.getEmployee() == null) {
                return hrRoleAllows(moduleKey, actionKey);
            }
        }

        if (user.getEmployee() == null) {
            return false;
        }

        boolean positionAllowed = false;
        if (user.getEmployee().getPosition() != null) {
            Long positionId = user.getEmployee().getPosition().getId();
            positionAllowed = permissionService.hasPermission(positionId, moduleKey, actionKey);
        }

        Long employeeId = user.getEmployee().getId();
        Optional<EmployeePermission> override = employeePermissionRepository
                .findByEmployeeIdAndModuleKeyAndActionKey(employeeId, moduleKey, actionKey);
        Boolean employeeOverride = override.map(EmployeePermission::isAllowed).orElse(null);
        boolean effective = PermissionService.resolveEffectivePermission(positionAllowed, employeeOverride);

        if (user.getRole() != null && user.getRole().getId() == HR_ROLE_ID) {
            return effective || hrRoleAllows(moduleKey, actionKey);
        }

        return effective;
    }

    private boolean hrRoleAllows(String moduleKey, String actionKey) {
        if ("CONTINUOUS_FEEDBACK".equals(moduleKey)) {
            return Set.of("view", "comment", "view_private_notes", "report").contains(actionKey);
        }
        return true;
    }
}
