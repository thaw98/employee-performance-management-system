package com.epms.backend.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.epms.backend.entity.User;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.service.PermissionService;

import lombok.RequiredArgsConstructor;

@Component("permissionGuard")
@RequiredArgsConstructor
public class PermissionGuard {

    private static final long AUDIT_ROLE_ID = 5L;

    private final PermissionService permissionService;
    private final UserRepository userRepository;

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

        if (user.getRole() != null && user.getRole().getId() != null && user.getRole().getId() == AUDIT_ROLE_ID) {
            return true;
        }

        if (user.getEmployee() == null || user.getEmployee().getPosition() == null) {
            return false;
        }

        Long positionId = user.getEmployee().getPosition().getId();
        return permissionService.hasPermission(positionId, moduleKey, actionKey);
    }
}
