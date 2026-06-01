package com.epms.backend.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.audit.AuditActionType;
import com.epms.backend.audit.AuditTargetType;
import com.epms.backend.dto.EmployeeEffectivePermissionDto;
import com.epms.backend.dto.EmployeePermissionDto;
import com.epms.backend.dto.PermissionActionDto;
import com.epms.backend.dto.PermissionMatrixDto;
import com.epms.backend.dto.PermissionModuleDto;
import com.epms.backend.dto.PositionPermissionDto;
import com.epms.backend.dto.UpdateEmployeePermissionRequest;
import com.epms.backend.dto.UpdatePositionPermissionRequest;
import com.epms.backend.dto.UserPermissionDto;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.EmployeePermission;
import com.epms.backend.entity.PermissionAction;
import com.epms.backend.entity.Position;
import com.epms.backend.entity.PositionPermission;
import com.epms.backend.entity.User;
import com.epms.backend.repository.EmployeePermissionRepository;
import com.epms.backend.repository.PermissionActionRepository;
import com.epms.backend.repository.PermissionModuleRepository;
import com.epms.backend.repository.PositionPermissionRepository;
import com.epms.backend.repository.PositionRepository;
import com.epms.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class PermissionService {

    private static final long HR_ROLE_ID = 1L;
    private static final long AUDIT_ROLE_ID = 5L;

    private final PermissionModuleRepository moduleRepository;
    private final PermissionActionRepository actionRepository;
    private final PositionPermissionRepository positionPermissionRepository;
    private final PositionRepository positionRepository;
    private final UserRepository userRepository;
    private final EmployeePermissionRepository employeePermissionRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public PermissionMatrixDto getPermissionMatrix(Long levelCodeId, Long roleId, String moduleKey) {
        List<PermissionModuleDto> modules = moduleRepository.findAllByOrderBySortOrderAsc()
                .stream()
                .map(m -> PermissionModuleDto.builder()
                        .id(m.getId())
                        .moduleKey(m.getModuleKey())
                        .displayName(m.getDisplayName())
                        .description(m.getDescription())
                        .sortOrder(m.getSortOrder())
                        .build())
                .collect(Collectors.toList());

        List<PermissionActionDto> allActions = actionRepository.findAllByOrderBySortOrderAsc()
                .stream()
                .map(a -> PermissionActionDto.builder()
                        .id(a.getId())
                        .moduleKey(a.getModuleKey())
                        .actionKey(a.getActionKey())
                        .displayName(a.getDisplayName())
                        .sortOrder(a.getSortOrder())
                        .build())
                .collect(Collectors.toList());

        final List<PermissionActionDto> filteredActions;
        if (moduleKey != null && !moduleKey.isBlank()) {
            filteredActions = allActions.stream()
                    .filter(a -> a.getModuleKey().equals(moduleKey))
                    .collect(Collectors.toList());
        } else {
            filteredActions = allActions;
        }

        List<Position> positions = positionRepository.findAll().stream()
                .filter(p -> "ACTIVE".equalsIgnoreCase(p.getStatus()) || p.getStatus() == null)
                .collect(Collectors.toList());

        if (levelCodeId != null) {
            positions = positions.stream()
                    .filter(p -> p.getLevelCode() != null && p.getLevelCode().getId().equals(levelCodeId))
                    .collect(Collectors.toList());
        }
        if (roleId != null) {
            positions = positions.stream()
                    .filter(p -> p.getRole() != null && p.getRole().getId().equals(roleId))
                    .collect(Collectors.toList());
        }

        final List<Position> finalPositions = positions;
        List<Long> positionIds = finalPositions.stream().map(Position::getId).collect(Collectors.toList());
        List<PositionPermission> existingPermissions = positionIds.isEmpty()
                ? List.of()
                : positionPermissionRepository.findByPositionIdIn(positionIds);

        Map<Long, Map<String, Boolean>> permMap = new LinkedHashMap<>();
        for (PositionPermission pp : existingPermissions) {
            permMap.computeIfAbsent(pp.getPosition().getId(), k -> new LinkedHashMap<>())
                    .put(pp.getModuleKey() + ":" + pp.getActionKey(), pp.isAllowed());
        }

        List<PermissionMatrixDto.PermissionMatrixPositionRow> rows = finalPositions.stream()
                .sorted((a, b) -> {
                    String lcA = a.getLevelCode() != null ? a.getLevelCode().getCode() : "";
                    String lcB = b.getLevelCode() != null ? b.getLevelCode().getCode() : "";
                    int cmp = lcA.compareTo(lcB);
                    if (cmp != 0) return cmp;
                    String nA = a.getName() != null ? a.getName() : "";
                    String nB = b.getName() != null ? b.getName() : "";
                    return nA.compareTo(nB);
                })
                .map(pos -> {
                    Map<String, Boolean> posPerms = permMap.getOrDefault(pos.getId(), new LinkedHashMap<>());
                    List<PermissionMatrixDto.PermissionMatrixPositionRow.PermissionToggle> toggles =
                            filteredActions.stream()
                                    .map(action -> {
                                        String key = action.getModuleKey() + ":" + action.getActionKey();
                                        boolean allowed = posPerms.getOrDefault(key, false);
                                        return PermissionMatrixDto.PermissionMatrixPositionRow.PermissionToggle.builder()
                                                .moduleKey(action.getModuleKey())
                                                .actionKey(action.getActionKey())
                                                .allowed(allowed)
                                                .build();
                                    })
                                    .collect(Collectors.toList());

                    return PermissionMatrixDto.PermissionMatrixPositionRow.builder()
                            .positionId(pos.getId())
                            .positionName(pos.getName())
                            .positionCode(pos.getCode())
                            .levelCodeId(pos.getLevelCode() != null ? pos.getLevelCode().getId() : null)
                            .levelCode(pos.getLevelCode() != null ? pos.getLevelCode().getCode() : "")
                            .levelCodeDescription(pos.getLevelCode() != null ? pos.getLevelCode().getDescription() : "")
                            .roleId(pos.getRole() != null ? pos.getRole().getId() : null)
                            .roleName(pos.getRole() != null ? pos.getRole().getName() : "")
                            .permissions(toggles)
                            .build();
                })
                .collect(Collectors.toList());

        return PermissionMatrixDto.builder()
                .modules(modules)
                .actions(filteredActions)
                .positions(rows)
                .build();
    }

    @Transactional
    public void updatePositionPermissions(Long positionId, UpdatePositionPermissionRequest request,
            Long performedByUserId, Long performedByRoleId) {
        Position position = positionRepository.findById(positionId)
                .orElseThrow(() -> new IllegalArgumentException("Position not found: " + positionId));

        // Self-lockout check: if the position being updated belongs to the current user,
        // prevent removing critical permissions that would lock them out.
        User performingUser = userRepository.findById(performedByUserId).orElse(null);
        if (performingUser != null
                && performingUser.getEmployee() != null
                && performingUser.getEmployee().getPosition() != null
                && performingUser.getEmployee().getPosition().getId().equals(positionId)) {
            // Not Audit (Audit always has full access regardless of position permissions)
            if (performingUser.getRole() == null || performingUser.getRole().getId() != AUDIT_ROLE_ID) {
                validateNoSelfLockout(performingUser, position, request);
            }
        }

        Map<String, PositionPermission> existingMap = positionPermissionRepository
                .findByPositionIdOrderByModuleKeyAscActionKeyAsc(positionId)
                .stream()
                .collect(Collectors.toMap(
                        pp -> pp.getModuleKey() + ":" + pp.getActionKey(),
                        pp -> pp,
                        (a, b) -> b));

        Map<String, PermissionAction> actionDetails = actionRepository.findAll().stream()
                .collect(Collectors.toMap(a -> a.getModuleKey() + ":" + a.getActionKey(), a -> a));

        List<String> beforeDataList = existingMap.values().stream()
                .map(pp -> pp.getModuleKey() + ":" + pp.getActionKey() + "=" + pp.isAllowed())
                .collect(Collectors.toList());

        StringBuilder detailedMetadata = new StringBuilder();
        detailedMetadata.append("{\"positionName\":\"").append(position.getName()).append("\"")
                .append(",\"positionCode\":\"").append(position.getCode()).append("\"")
                .append(",\"roleName\":\"").append(position.getRole() != null ? position.getRole().getName() : "").append("\"")
                .append(",\"moduleKey\":\"").append(request.getModuleKey() != null ? request.getModuleKey() : "").append("\"");

        List<String> afterDataList = new ArrayList<>();
        List<Map<String, Object>> changeDetails = new ArrayList<>();

        for (UpdatePositionPermissionRequest.PermissionToggleUpdate toggle : request.getPermissions()) {
            String key = toggle.getModuleKey() + ":" + toggle.getActionKey();
            PositionPermission existing = existingMap.get(key);
            boolean beforeAllowed = existing != null && existing.isAllowed();

            if (existing != null) {
                existing.setAllowed(toggle.isAllowed());
                existing.setUpdatedAt(Instant.now());
                positionPermissionRepository.save(existing);
            } else {
                PositionPermission pp = new PositionPermission();
                pp.setPosition(position);
                pp.setModuleKey(toggle.getModuleKey());
                pp.setActionKey(toggle.getActionKey());
                pp.setAllowed(toggle.isAllowed());
                pp.setCreatedAt(Instant.now());
                pp.setUpdatedAt(Instant.now());
                positionPermissionRepository.save(pp);
            }

            String actionName = actionDetails.containsKey(key)
                    ? actionDetails.get(key).getDisplayName()
                    : toggle.getActionKey();
            afterDataList.add(toggle.getModuleKey() + ":" + toggle.getActionKey() + "=" + toggle.isAllowed());

            Map<String, Object> detail = new LinkedHashMap<>();
            detail.put("moduleKey", toggle.getModuleKey());
            detail.put("actionKey", toggle.getActionKey());
            detail.put("actionName", actionName);
            detail.put("before", beforeAllowed);
            detail.put("after", toggle.isAllowed());
            changeDetails.add(detail);
        }

        detailedMetadata.append(",\"changes\":").append(changeDetails.size());
        detailedMetadata.append(",\"details\":[");
        for (int i = 0; i < changeDetails.size(); i++) {
            Map<String, Object> d = changeDetails.get(i);
            detailedMetadata.append("{\"moduleKey\":\"").append(d.get("moduleKey"))
                    .append("\",\"actionKey\":\"").append(d.get("actionKey"))
                    .append("\",\"actionName\":\"").append(d.get("actionName"))
                    .append("\",\"before\":").append(d.get("before"))
                    .append(",\"after\":").append(d.get("after"))
                    .append("}");
            if (i < changeDetails.size() - 1) {
                detailedMetadata.append(",");
            }
        }
        detailedMetadata.append("]}");
        String metadataJson = detailedMetadata.toString();

        String afterData = String.join(",", afterDataList);
        String beforeData = String.join(",", beforeDataList);

        auditService.record(
                AuditActionType.PERMISSION_MATRIX_UPDATED,
                AuditTargetType.POSITION_PERMISSION,
                positionId,
                performedByUserId,
                performedByRoleId,
                "Updated permission matrix for position: " + position.getName()
                        + " (" + position.getCode() + ")",
                metadataJson,
                beforeData,
                afterData);
    }

    private void validateNoSelfLockout(User user, Position position, UpdatePositionPermissionRequest request) {
        Long userRoleId = user.getRole() != null ? user.getRole().getId() : null;
        if (userRoleId == null) {
            return;
        }

        // Get current permissions for the position
        Map<String, Boolean> currentPerms = positionPermissionRepository
                .findByPositionIdOrderByModuleKeyAscActionKeyAsc(position.getId())
                .stream()
                .collect(Collectors.toMap(
                        pp -> pp.getModuleKey() + ":" + pp.getActionKey(),
                        PositionPermission::isAllowed));

        // Apply the requested changes to see what the final state would be
        Map<String, Boolean> afterPerms = new LinkedHashMap<>(currentPerms);
        for (UpdatePositionPermissionRequest.PermissionToggleUpdate toggle : request.getPermissions()) {
            afterPerms.put(toggle.getModuleKey() + ":" + toggle.getActionKey(), toggle.isAllowed());
        }

        // Check if at least one "manage" or "view" permission remains
        boolean hasRemainingAccess = afterPerms.values().stream().anyMatch(v -> v);
        if (!hasRemainingAccess) {
            throw new IllegalStateException(
                    "Cannot save: this would remove all permissions from your position (" + position.getName()
                            + "), causing a self-lockout. At least one permission must remain enabled.");
        }
    }

    @Transactional(readOnly = true)
    public UserPermissionDto getUserPermissions(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        Long positionId = null;
        String positionName = null;
        String roleName = null;
        Map<String, Map<String, Boolean>> permissions = new LinkedHashMap<>();

        if (user.getEmployee() != null) {
            Employee employee = user.getEmployee();

            if (employee.getPosition() != null) {
                Position position = employee.getPosition();
                positionId = position.getId();
                positionName = position.getName();
                roleName = position.getRole() != null ? position.getRole().getName() : null;

                List<PositionPermission> ppList = positionPermissionRepository
                        .findByPositionIdOrderByModuleKeyAscActionKeyAsc(positionId);

                for (PositionPermission pp : ppList) {
                    permissions.computeIfAbsent(pp.getModuleKey(), k -> new LinkedHashMap<>())
                            .put(pp.getActionKey(), pp.isAllowed());
                }
            }

            // Merge employee overrides with position permissions (both must allow when override exists)
            List<EmployeePermission> overrides = employeePermissionRepository.findByEmployeeId(employee.getId());
            for (EmployeePermission ep : overrides) {
                boolean positionAllowed = permissions
                        .getOrDefault(ep.getModuleKey(), Map.of())
                        .getOrDefault(ep.getActionKey(), false);
                boolean effective = resolveEffectivePermission(positionAllowed, ep.isAllowed());
                permissions.computeIfAbsent(ep.getModuleKey(), k -> new LinkedHashMap<>())
                        .put(ep.getActionKey(), effective);
            }
        }

        return UserPermissionDto.builder()
                .userId(userId)
                .positionId(positionId)
                .positionName(positionName)
                .roleName(roleName)
                .permissions(permissions)
                .build();
    }

    @Transactional(readOnly = true)
    public boolean hasPermission(Long positionId, String moduleKey, String actionKey) {
        Optional<PositionPermission> pp = positionPermissionRepository
                .findByPositionIdAndModuleKeyAndActionKey(positionId, moduleKey, actionKey);
        return pp.map(PositionPermission::isAllowed).orElse(false);
    }

    /**
     * Effective permission requires the position (group) grant and, when present,
     * an employee override that is also allowed. Employee-only allow cannot bypass
     * a denied position permission.
     */
    public static boolean resolveEffectivePermission(boolean positionAllowed, Boolean employeeOverride) {
        if (employeeOverride == null) {
            return positionAllowed;
        }
        return positionAllowed && employeeOverride;
    }

    @Transactional(readOnly = true)
    public boolean hasPermissionForUserId(Long userId, String moduleKey, String actionKey) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return false;
        }
        if (user.getRole() != null && user.getRole().getId() == AUDIT_ROLE_ID) {
            return true;
        }
        if (user.getEmployee() == null) {
            return false;
        }

        boolean positionAllowed = false;
        if (user.getEmployee().getPosition() != null) {
            Long positionId = user.getEmployee().getPosition().getId();
            positionAllowed = hasPermission(positionId, moduleKey, actionKey);
        }

        Long employeeId = user.getEmployee().getId();
        Optional<EmployeePermission> override = employeePermissionRepository
                .findByEmployeeIdAndModuleKeyAndActionKey(employeeId, moduleKey, actionKey);
        Boolean employeeOverride = override.map(EmployeePermission::isAllowed).orElse(null);
        return resolveEffectivePermission(positionAllowed, employeeOverride);
    }

    public List<PositionPermissionDto> getPositionPermissions(Long positionId) {
        return positionPermissionRepository.findByPositionIdOrderByModuleKeyAscActionKeyAsc(positionId)
                .stream()
                .map(pp -> PositionPermissionDto.builder()
                        .positionId(pp.getPosition().getId())
                        .positionName(pp.getPosition().getName())
                        .positionCode(pp.getPosition().getCode())
                        .levelCode(pp.getPosition().getLevelCode() != null ? pp.getPosition().getLevelCode().getCode() : "")
                        .levelCodeDescription(pp.getPosition().getLevelCode() != null ? pp.getPosition().getLevelCode().getDescription() : "")
                        .roleName(pp.getPosition().getRole() != null ? pp.getPosition().getRole().getName() : "")
                        .moduleKey(pp.getModuleKey())
                        .actionKey(pp.getActionKey())
                        .allowed(pp.isAllowed())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EmployeePermissionDto getEmployeePermissionMatrix(String search, String moduleKey) {
        List<PermissionModuleDto> modules = moduleRepository.findAllByOrderBySortOrderAsc()
                .stream()
                .map(m -> PermissionModuleDto.builder()
                        .id(m.getId())
                        .moduleKey(m.getModuleKey())
                        .displayName(m.getDisplayName())
                        .description(m.getDescription())
                        .sortOrder(m.getSortOrder())
                        .build())
                .collect(Collectors.toList());

        List<PermissionActionDto> allActions = actionRepository.findAllByOrderBySortOrderAsc()
                .stream()
                .map(a -> PermissionActionDto.builder()
                        .id(a.getId())
                        .moduleKey(a.getModuleKey())
                        .actionKey(a.getActionKey())
                        .displayName(a.getDisplayName())
                        .sortOrder(a.getSortOrder())
                        .build())
                .collect(Collectors.toList());

        final List<PermissionActionDto> filteredActions;
        if (moduleKey != null && !moduleKey.isBlank()) {
            filteredActions = allActions.stream()
                    .filter(a -> a.getModuleKey().equals(moduleKey))
                    .collect(Collectors.toList());
        } else {
            filteredActions = allActions;
        }

        // Get all non-audit users with active accounts and employee records
        List<User> users = userRepository.findByRole_IdNotAndActiveTrue(AUDIT_ROLE_ID);

        if (search != null && !search.isBlank()) {
            String q = search.toLowerCase();
            users = users.stream()
                    .filter(u -> u.getEmployee() != null
                            && (u.getEmployee().getEmployeeName().toLowerCase().contains(q)
                            || (u.getEmployee().getEmployeeId() != null && u.getEmployee().getEmployeeId().toLowerCase().contains(q))
                            || (u.getEmployee().getPosition() != null && u.getEmployee().getPosition().getName().toLowerCase().contains(q))))
                    .collect(Collectors.toList());
        }

        // Filter out users without employee records
        List<User> validUsers = users.stream()
                .filter(u -> u.getEmployee() != null)
                .collect(Collectors.toList());

        List<Long> employeeIds = validUsers.stream()
                .map(u -> u.getEmployee().getId())
                .collect(Collectors.toList());

        // Get position permissions for all these employees' positions
        Map<Long, Map<String, Boolean>> positionPermMap = new LinkedHashMap<>();
        Map<Long, Long> empPositionMap = new LinkedHashMap<>();
        for (User u : validUsers) {
            if (u.getEmployee().getPosition() != null) {
                Long posId = u.getEmployee().getPosition().getId();
                empPositionMap.put(u.getEmployee().getId(), posId);
                if (!positionPermMap.containsKey(posId)) {
                    List<PositionPermission> pps = positionPermissionRepository
                            .findByPositionIdOrderByModuleKeyAscActionKeyAsc(posId);
                    Map<String, Boolean> permMap = new LinkedHashMap<>();
                    for (PositionPermission pp : pps) {
                        permMap.put(pp.getModuleKey() + ":" + pp.getActionKey(), pp.isAllowed());
                    }
                    positionPermMap.put(posId, permMap);
                }
            }
        }

        // Get employee overrides
        List<EmployeePermission> allOverrides = employeeIds.isEmpty()
                ? List.of()
                : employeePermissionRepository.findByEmployeeIdIn(employeeIds);
        Map<Long, Map<String, Boolean>> overrideMap = new LinkedHashMap<>();
        for (EmployeePermission ep : allOverrides) {
            overrideMap.computeIfAbsent(ep.getEmployee().getId(), k -> new LinkedHashMap<>())
                    .put(ep.getModuleKey() + ":" + ep.getActionKey(), ep.isAllowed());
        }

        List<EmployeePermissionDto.EmployeePermissionRow> rows = validUsers.stream()
                .sorted((a, b) -> {
                    String na = a.getEmployee() != null ? a.getEmployee().getEmployeeName() : "";
                    String nb = b.getEmployee() != null ? b.getEmployee().getEmployeeName() : "";
                    return na.compareTo(nb);
                })
                .map(u -> {
                    Employee emp = u.getEmployee();
                    Map<String, Boolean> posPerms = emp.getPosition() != null && empPositionMap.containsKey(emp.getId())
                            ? positionPermMap.getOrDefault(empPositionMap.get(emp.getId()), new LinkedHashMap<>())
                            : new LinkedHashMap<>();
                    Map<String, Boolean> empOverrides = overrideMap.getOrDefault(emp.getId(), new LinkedHashMap<>());

                    List<EmployeePermissionDto.EmployeePermissionToggle> toggles = filteredActions.stream()
                            .map(action -> {
                                String key = action.getModuleKey() + ":" + action.getActionKey();
                                Boolean posAllowed = posPerms.getOrDefault(key, false);
                                Boolean override = empOverrides.containsKey(key) ? empOverrides.get(key) : null;
                                Boolean effective = resolveEffectivePermission(posAllowed, override);
                                return EmployeePermissionDto.EmployeePermissionToggle.builder()
                                        .moduleKey(action.getModuleKey())
                                        .actionKey(action.getActionKey())
                                        .positionAllowed(posAllowed)
                                        .override(override)
                                        .effective(effective)
                                        .build();
                            })
                            .collect(Collectors.toList());

                    return EmployeePermissionDto.EmployeePermissionRow.builder()
                            .employeeId(emp.getId())
                            .employeeName(emp.getEmployeeName())
                            .employeeCode(emp.getEmployeeId())
                            .positionName(emp.getPosition() != null ? emp.getPosition().getName() : "")
                            .positionCode(emp.getPosition() != null ? emp.getPosition().getCode() : "")
                            .departmentName(emp.getDepartment() != null ? emp.getDepartment().getName() : "")
                            .roleId(u.getRole() != null ? u.getRole().getId() : null)
                            .roleName(u.getRole() != null ? u.getRole().getName() : "")
                            .permissions(toggles)
                            .build();
                })
                .collect(Collectors.toList());

        return EmployeePermissionDto.builder()
                .modules(modules)
                .actions(filteredActions)
                .employees(rows)
                .build();
    }

    @Transactional(readOnly = true)
    public EmployeeEffectivePermissionDto getEmployeeEffectivePermissions(Long employeeId) {
        Employee employee = userRepository.findByEmployee_Id(employeeId)
                .map(User::getEmployee)
                .orElse(null);
        if (employee == null) {
            return null;
        }

        User user = userRepository.findByEmployee_Id(employeeId).orElse(null);

        Map<String, Boolean> positionPerms = new LinkedHashMap<>();
        Long positionId = null;
        String positionName = null;
        String positionCode = null;

        if (employee.getPosition() != null) {
            positionId = employee.getPosition().getId();
            positionName = employee.getPosition().getName();
            positionCode = employee.getPosition().getCode();
            List<PositionPermission> pps = positionPermissionRepository
                    .findByPositionIdOrderByModuleKeyAscActionKeyAsc(positionId);
            for (PositionPermission pp : pps) {
                positionPerms.put(pp.getModuleKey() + ":" + pp.getActionKey(), pp.isAllowed());
            }
        }

        List<EmployeePermission> overrides = employeePermissionRepository.findByEmployeeId(employeeId);
        Map<String, Boolean> overrideMap = new LinkedHashMap<>();
        for (EmployeePermission ep : overrides) {
            overrideMap.put(ep.getModuleKey() + ":" + ep.getActionKey(), ep.isAllowed());
        }

        List<PermissionAction> allActions = actionRepository.findAllByOrderBySortOrderAsc();
        List<EmployeeEffectivePermissionDto.PermissionDetail> details = allActions.stream()
                .map(a -> {
                    String key = a.getModuleKey() + ":" + a.getActionKey();
                    Boolean posPerm = positionPerms.getOrDefault(key, false);
                    Boolean override = overrideMap.containsKey(key) ? overrideMap.get(key) : null;
                    Boolean effective = resolveEffectivePermission(posPerm, override);
                    return EmployeeEffectivePermissionDto.PermissionDetail.builder()
                            .moduleKey(a.getModuleKey())
                            .actionKey(a.getActionKey())
                            .positionPermission(posPerm)
                            .override(override)
                            .effective(effective)
                            .build();
                })
                .collect(Collectors.toList());

        return EmployeeEffectivePermissionDto.builder()
                .employeeId(employee.getId())
                .employeeName(employee.getEmployeeName())
                .employeeCode(employee.getEmployeeId())
                .positionId(positionId)
                .positionName(positionName)
                .positionCode(positionCode)
                .roleId(user != null && user.getRole() != null ? user.getRole().getId() : null)
                .roleName(user != null && user.getRole() != null ? user.getRole().getName() : "")
                .departmentName(employee.getDepartment() != null ? employee.getDepartment().getName() : "")
                .permissionDetails(details)
                .build();
    }

    @Transactional
    public void saveEmployeePermissions(Long employeeId, UpdateEmployeePermissionRequest request,
            Long performedByUserId, Long performedByRoleId) {
        Employee employee = userRepository.findByEmployee_Id(employeeId)
                .map(User::getEmployee)
                .orElse(null);
        if (employee == null) {
            throw new IllegalArgumentException("Employee not found or has no user account: " + employeeId);
        }

        User targetUser = userRepository.findByEmployee_Id(employeeId).orElse(null);
        if (targetUser != null && targetUser.getRole() != null && targetUser.getRole().getId() == AUDIT_ROLE_ID) {
            throw new IllegalArgumentException("Cannot modify permissions for audit-role employees");
        }

        Map<String, EmployeePermission> existingOverrides = employeePermissionRepository
                .findByEmployeeId(employeeId)
                .stream()
                .collect(Collectors.toMap(
                        ep -> ep.getModuleKey() + ":" + ep.getActionKey(),
                        ep -> ep,
                        (a, b) -> b));

        Map<String, String> positionPerms = new LinkedHashMap<>();
        if (employee.getPosition() != null) {
            List<PositionPermission> pps = positionPermissionRepository
                    .findByPositionIdOrderByModuleKeyAscActionKeyAsc(employee.getPosition().getId());
            for (PositionPermission pp : pps) {
                positionPerms.put(pp.getModuleKey() + ":" + pp.getActionKey(), String.valueOf(pp.isAllowed()));
            }
        }

        List<String> beforeDataList = existingOverrides.values().stream()
                .map(ep -> ep.getModuleKey() + ":" + ep.getActionKey() + "=" + ep.isAllowed())
                .collect(Collectors.toList());

        StringBuilder detailedMetadata = new StringBuilder();
        detailedMetadata.append("{\"employeeName\":\"").append(employee.getEmployeeName()).append("\"")
                .append(",\"employeeCode\":\"").append(employee.getEmployeeId() != null ? employee.getEmployeeId() : "").append("\"");

        String targetModuleKey = request.getModuleKey() != null ? request.getModuleKey() : "";
        detailedMetadata.append(",\"moduleKey\":\"").append(targetModuleKey).append("\"");

        List<String> afterDataList = new ArrayList<>();
        List<Map<String, Object>> changeDetails = new ArrayList<>();
        int changeCount = 0;

        for (UpdateEmployeePermissionRequest.EmployeePermissionOverride override : request.getPermissions()) {
            String key = override.getModuleKey() + ":" + override.getActionKey();
            EmployeePermission existing = existingOverrides.get(key);
            Boolean beforeValue = existing != null ? existing.isAllowed() : null;

            if (override.getOverride() == null) {
                // Clear override (inherit)
                if (existing != null) {
                    employeePermissionRepository.delete(existing);
                    changeCount++;
                }
            } else {
                // Set override
                boolean newValue = override.getOverride();
                if (existing != null) {
                    existing.setAllowed(newValue);
                    existing.setUpdatedAt(Instant.now());
                    employeePermissionRepository.save(existing);
                } else {
                    EmployeePermission ep = new EmployeePermission();
                    ep.setEmployee(employee);
                    ep.setModuleKey(override.getModuleKey());
                    ep.setActionKey(override.getActionKey());
                    ep.setAllowed(newValue);
                    ep.setCreatedAt(Instant.now());
                    ep.setUpdatedAt(Instant.now());
                    employeePermissionRepository.save(ep);
                }
                changeCount++;
            }

            String displayAfter = override.getOverride() != null
                    ? String.valueOf(override.getOverride())
                    : "INHERIT";
            afterDataList.add(override.getModuleKey() + ":" + override.getActionKey() + "=" + displayAfter);

            Map<String, Object> detail = new LinkedHashMap<>();
            detail.put("moduleKey", override.getModuleKey());
            detail.put("actionKey", override.getActionKey());
            detail.put("before", beforeValue);
            detail.put("after", override.getOverride());
            changeDetails.add(detail);
        }

        detailedMetadata.append(",\"changes\":").append(changeCount);
        detailedMetadata.append(",\"details\":[");
        for (int i = 0; i < changeDetails.size(); i++) {
            Map<String, Object> d = changeDetails.get(i);
            detailedMetadata.append("{\"moduleKey\":\"").append(d.get("moduleKey"))
                    .append("\",\"actionKey\":\"").append(d.get("actionKey"))
                    .append("\",\"before\":").append(d.get("before"))
                    .append(",\"after\":").append(d.get("after"))
                    .append("}");
            if (i < changeDetails.size() - 1) {
                detailedMetadata.append(",");
            }
        }
        detailedMetadata.append("]}");
        String metadataJson = detailedMetadata.toString();

        String afterData = String.join(",", afterDataList);
        String beforeData = String.join(",", beforeDataList);

        auditService.record(
                AuditActionType.EMPLOYEE_PERMISSION_UPDATED,
                AuditTargetType.EMPLOYEE_PERMISSION,
                employeeId,
                performedByUserId,
                performedByRoleId,
                "Updated employee permission overrides for: " + employee.getEmployeeName()
                        + " (" + (employee.getEmployeeId() != null ? employee.getEmployeeId() : "") + ")",
                metadataJson,
                beforeData,
                afterData);
    }
}
