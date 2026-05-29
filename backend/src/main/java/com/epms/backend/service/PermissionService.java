package com.epms.backend.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.dto.PermissionActionDto;
import com.epms.backend.dto.PermissionMatrixDto;
import com.epms.backend.dto.PermissionModuleDto;
import com.epms.backend.dto.PositionPermissionDto;
import com.epms.backend.dto.UpdatePositionPermissionRequest;
import com.epms.backend.dto.UserPermissionDto;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.Position;
import com.epms.backend.entity.PositionPermission;
import com.epms.backend.entity.User;
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

    private static final long AUDIT_ROLE_ID = 5L;

    private final PermissionModuleRepository moduleRepository;
    private final PermissionActionRepository actionRepository;
    private final PositionPermissionRepository positionPermissionRepository;
    private final PositionRepository positionRepository;
    private final UserRepository userRepository;
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
                                        boolean allowed = posPerms.getOrDefault(key, true);
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

        Map<String, PositionPermission> existingMap = positionPermissionRepository
                .findByPositionIdOrderByModuleKeyAscActionKeyAsc(positionId)
                .stream()
                .collect(Collectors.toMap(
                        pp -> pp.getModuleKey() + ":" + pp.getActionKey(),
                        pp -> pp,
                        (a, b) -> b));

        List<String> beforeKeys = new ArrayList<>(existingMap.keySet());
        List<String> beforeDataList = existingMap.values().stream()
                .map(pp -> pp.getModuleKey() + ":" + pp.getActionKey() + "=" + pp.isAllowed())
                .collect(Collectors.toList());
        String beforeData = String.join(",", beforeDataList);

        List<String> afterDataList = new ArrayList<>();

        for (UpdatePositionPermissionRequest.PermissionToggleUpdate toggle : request.getPermissions()) {
            String key = toggle.getModuleKey() + ":" + toggle.getActionKey();
            PositionPermission existing = existingMap.get(key);

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
            afterDataList.add(toggle.getModuleKey() + ":" + toggle.getActionKey() + "=" + toggle.isAllowed());
        }

        String afterData = String.join(",", afterDataList);

        auditService.record(
                "PERMISSION_MATRIX_UPDATED",
                "POSITION_PERMISSION",
                positionId,
                performedByUserId,
                performedByRoleId,
                "Updated permission matrix for position: " + position.getName(),
                "{\"positionName\":\"" + position.getName() + "\",\"changes\":" + request.getPermissions().size() + "}",
                beforeData,
                afterData);
    }

    @Transactional(readOnly = true)
    public UserPermissionDto getUserPermissions(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        Long positionId = null;
        String positionName = null;
        String roleName = null;
        Map<String, Map<String, Boolean>> permissions = new LinkedHashMap<>();

        if (user.getEmployee() != null && user.getEmployee().getPosition() != null) {
            Position position = user.getEmployee().getPosition();
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
        return pp.map(PositionPermission::isAllowed).orElse(true);
    }

    @Transactional(readOnly = true)
    public boolean hasPermissionForUserId(Long userId, String moduleKey, String actionKey) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || user.getEmployee() == null || user.getEmployee().getPosition() == null) {
            return true;
        }
        Long positionId = user.getEmployee().getPosition().getId();
        return hasPermission(positionId, moduleKey, actionKey);
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
}
