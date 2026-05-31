package com.epms.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.PermissionMatrixDto;
import com.epms.backend.dto.PositionPermissionDto;
import com.epms.backend.dto.UpdatePositionPermissionRequest;
import com.epms.backend.dto.UserPermissionDto;
import com.epms.backend.entity.User;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.service.PermissionService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/permissions")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionService permissionService;
    private final UserRepository userRepository;

    @GetMapping("/matrix")
    @PreAuthorize("principal.roleId == 5")
    public ResponseEntity<ApiResponse<PermissionMatrixDto>> getPermissionMatrix(
            @RequestParam(required = false) Long levelCodeId,
            @RequestParam(required = false) Long roleId,
            @RequestParam(required = false) String moduleKey) {
        PermissionMatrixDto matrix = permissionService.getPermissionMatrix(levelCodeId, roleId, moduleKey);
        return ResponseEntity.ok(ApiResponse.ok("Permission matrix fetched successfully", matrix));
    }

    @GetMapping("/matrix/positions/{positionId}")
    @PreAuthorize("principal.roleId == 5")
    public ResponseEntity<ApiResponse<List<PositionPermissionDto>>> getPositionPermissions(
            @PathVariable Long positionId) {
        List<PositionPermissionDto> permissions = permissionService.getPositionPermissions(positionId);
        return ResponseEntity.ok(ApiResponse.ok("Position permissions fetched successfully", permissions));
    }

    @PutMapping("/matrix/positions/{positionId}")
    @PreAuthorize("principal.roleId == 5")
    public ResponseEntity<ApiResponse<String>> updatePositionPermissions(
            @PathVariable Long positionId,
            @RequestBody UpdatePositionPermissionRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        Long userId = Long.parseLong(username);
        User user = userRepository.findById(userId).orElse(null);

        Long roleId = user != null && user.getRole() != null ? user.getRole().getId() : null;

        permissionService.updatePositionPermissions(positionId, request, userId, roleId);
        return ResponseEntity.ok(ApiResponse.ok("Position permissions updated successfully", null));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserPermissionDto>> getMyPermissions() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        Long userId = Long.parseLong(username);
        UserPermissionDto permissions = permissionService.getUserPermissions(userId);
        return ResponseEntity.ok(ApiResponse.ok("User permissions fetched successfully", permissions));
    }
}
