package com.epms.backend.config;

import java.time.Instant;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.entity.PermissionAction;
import com.epms.backend.entity.PermissionModule;
import com.epms.backend.entity.Position;
import com.epms.backend.entity.PositionPermission;
import com.epms.backend.repository.PermissionActionRepository;
import com.epms.backend.repository.PermissionModuleRepository;
import com.epms.backend.repository.PositionPermissionRepository;
import com.epms.backend.repository.PositionRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class PermissionDataInitializer implements CommandLineRunner {

    private static final long HR_ROLE_ID = 1L;
    private static final long DEPARTMENT_HEAD_ROLE_ID = 2L;
    private static final long MANAGER_ROLE_ID = 3L;
    private static final long EMPLOYEE_ROLE_ID = 4L;
    private static final long AUDIT_ROLE_ID = 5L;

    private final PermissionModuleRepository moduleRepository;
    private final PermissionActionRepository actionRepository;
    private final PositionRepository positionRepository;
    private final PositionPermissionRepository positionPermissionRepository;

    @Override
    @Transactional
    public void run(String... args) {
        seedModules();
        seedActions();
        seedPositionPermissionDefaults();
        log.info("Permission modules, actions, and position defaults initialized");
    }

    private void seedModules() {
        int order = 0;
        for (String[] module : List.of(
                new String[]{"KPI", "KPI Management", "Key Performance Indicators management"},
                new String[]{"360_FEEDBACK", "360 Feedback", "360-degree feedback system"},
                new String[]{"PIP", "Performance Improvement Plan", "PIP creation and tracking"},
                new String[]{"SELF_ASSESSMENT", "Self Assessment", "Self-assessment forms and templates"},
                new String[]{"MEETINGS", "Meetings / One-on-One", "Meeting scheduling and management"},
                new String[]{"REPORTS", "Reports", "Performance and analytics reports"},
                new String[]{"EMPLOYEE_PROFILE", "Employee / Profile Basics", "Employee and profile management"},
                new String[]{"CONTINUOUS_FEEDBACK", "Continuous Feedback", "Continuous performance feedback management"})) {
            if (!moduleRepository.existsByModuleKey(module[0])) {
                PermissionModule m = new PermissionModule();
                m.setModuleKey(module[0]);
                m.setDisplayName(module[1]);
                m.setDescription(module[2]);
                m.setSortOrder(order);
                m.setCreatedAt(Instant.now());
                m.setUpdatedAt(Instant.now());
                moduleRepository.save(m);
            }
            order++;
        }
    }

    private void seedActions() {
        Map<String, List<String[]>> moduleActions = new LinkedHashMap<>();

        moduleActions.put("KPI", List.of(
                new String[]{"view", "View KPIs", "1"},
                new String[]{"manage", "Manage KPIs", "2"},
                new String[]{"assign", "Assign KPIs", "3"},
                new String[]{"history", "View KPI History", "4"},
                new String[]{"report", "KPI Reports", "5"},
                new String[]{"export", "Export KPI Data", "6"},
                new String[]{"configure", "Configure KPI Settings", "7"}));

        moduleActions.put("360_FEEDBACK", List.of(
                new String[]{"view", "View Feedback", "1"},
                new String[]{"give", "Give Feedback", "2"},
                new String[]{"assign", "Assign Feedback", "3"},
                new String[]{"manage_templates", "Manage Templates", "4"},
                new String[]{"review_history", "Review History", "5"},
                new String[]{"report", "Feedback Reports", "6"},
                new String[]{"export", "Export Feedback Data", "7"},
                new String[]{"configure", "Configure Feedback Settings", "8"}));

        moduleActions.put("PIP", List.of(
                new String[]{"view", "View PIPs", "1"},
                new String[]{"create", "Create PIP", "2"},
                new String[]{"update", "Update PIP", "3"},
                new String[]{"review_notes", "Review Notes", "4"},
                new String[]{"schedule_meeting", "Schedule Meeting", "5"},
                new String[]{"close_reopen", "Close/Reopen PIP", "6"},
                new String[]{"report", "PIP Reports", "7"},
                new String[]{"export", "Export PIP Data", "8"}));

        moduleActions.put("SELF_ASSESSMENT", List.of(
                new String[]{"view", "View Self Assessment", "1"},
                new String[]{"manage_templates", "Manage Templates", "2"},
                new String[]{"assign", "Assign Forms", "3"},
                new String[]{"review", "Review Forms", "4"},
                new String[]{"unlock", "Unlock Forms", "5"},
                new String[]{"approve", "Approve Forms", "6"},
                new String[]{"history", "View History", "7"},
                new String[]{"report", "Reports", "8"},
                new String[]{"export", "Export Data", "9"},
                new String[]{"configure", "Configure Settings", "10"}));

        moduleActions.put("MEETINGS", List.of(
                new String[]{"view", "View Meetings", "1"},
                new String[]{"schedule", "Schedule Meeting", "2"},
                new String[]{"request", "Request Meeting", "3"},
                new String[]{"reschedule", "Reschedule Meeting", "4"},
                new String[]{"cancel", "Cancel Meeting", "5"},
                new String[]{"approve_cancel", "Approve Cancellation", "6"},
                new String[]{"finish", "Finish Meeting", "7"},
                new String[]{"notes", "Meeting Notes", "8"},
                new String[]{"history", "Meeting History", "9"}));

        moduleActions.put("REPORTS", List.of(
                new String[]{"view", "View Reports", "1"},
                new String[]{"performance_report", "Performance Report", "2"},
                new String[]{"kpi_report", "KPI Report", "3"},
                new String[]{"feedback_report", "Feedback Report", "4"},
                new String[]{"appraisal_report", "Appraisal Report", "5"},
                new String[]{"self_assessment_report", "Self Assessment Report", "6"},
                new String[]{"pip_report", "PIP Report", "7"},
                new String[]{"export", "Export Reports", "8"}));

        moduleActions.put("EMPLOYEE_PROFILE", List.of(
                new String[]{"view_employee", "View Employee", "1"},
                new String[]{"manage_employee", "Manage Employee", "2"},
                new String[]{"view_org_setup", "View Org Setup", "3"}));

        moduleActions.put("CONTINUOUS_FEEDBACK", List.of(
                new String[]{"view", "View Feedback", "1"},
                new String[]{"create", "Create Feedback", "2"},
                new String[]{"comment", "Add Comments", "3"},
                new String[]{"acknowledge", "Acknowledge Feedback", "4"},
                new String[]{"manage_action_items", "Manage Action Items", "5"},
                new String[]{"create_followup_meeting", "Create Follow-up Meeting", "6"},
                new String[]{"create_pip", "Create PIP", "7"},
                new String[]{"view_private_notes", "View Private Notes", "8"},
                new String[]{"report", "Generate Reports", "9"},
                new String[]{"audit", "Audit Feedback", "10"}));

        int order = 0;
        for (Map.Entry<String, List<String[]>> entry : moduleActions.entrySet()) {
            String moduleKey = entry.getKey();
            for (String[] action : entry.getValue()) {
                if (!actionRepository.existsByModuleKeyAndActionKey(moduleKey, action[0])) {
                    PermissionAction a = new PermissionAction();
                    a.setModuleKey(moduleKey);
                    a.setActionKey(action[0]);
                    a.setDisplayName(action[1]);
                    a.setSortOrder(Integer.parseInt(action[2]));
                    a.setCreatedAt(Instant.now());
                    a.setUpdatedAt(Instant.now());
                    actionRepository.save(a);
                }
                order++;
            }
        }
    }

    private void seedPositionPermissionDefaults() {
        List<PermissionAction> actions = actionRepository.findAllByOrderBySortOrderAsc();
        if (actions.isEmpty()) {
            return;
        }

        List<Position> activePositions = positionRepository.findAll().stream()
                .filter(position -> position.getStatus() == null || "ACTIVE".equalsIgnoreCase(position.getStatus()))
                .toList();

        int created = 0;
        for (Position position : activePositions) {
            Set<String> existingKeys = positionPermissionRepository
                    .findByPositionIdOrderByModuleKeyAscActionKeyAsc(position.getId())
                    .stream()
                    .map(permission -> permission.getModuleKey() + ":" + permission.getActionKey())
                    .collect(java.util.stream.Collectors.toCollection(HashSet::new));

            Long roleId = position.getRole() != null ? position.getRole().getId() : null;
            for (PermissionAction action : actions) {
                String key = action.getModuleKey() + ":" + action.getActionKey();
                if (existingKeys.contains(key)) {
                    continue;
                }

                PositionPermission permission = new PositionPermission();
                permission.setPosition(position);
                permission.setModuleKey(action.getModuleKey());
                permission.setActionKey(action.getActionKey());
                permission.setAllowed(defaultAllowedForRole(roleId, action.getModuleKey(), action.getActionKey()));
                permission.setCreatedAt(Instant.now());
                permission.setUpdatedAt(Instant.now());
                positionPermissionRepository.save(permission);
                created++;
            }
        }

        if (created > 0) {
            log.info("Created {} missing position_permission default rows", created);
        }
    }

    private boolean defaultAllowedForRole(Long roleId, String moduleKey, String actionKey) {
        if (roleId == null) {
            return false;
        }
        if (roleId == AUDIT_ROLE_ID) {
            if ("CONTINUOUS_FEEDBACK".equals(moduleKey) && "create_pip".equals(actionKey)) {
                return false;
            }
            return true;
        }
        if (roleId == HR_ROLE_ID) {
            return defaultAllowedForHr(moduleKey, actionKey);
        }
        if (roleId == DEPARTMENT_HEAD_ROLE_ID || roleId == MANAGER_ROLE_ID) {
            return defaultAllowedForManager(moduleKey, actionKey);
        }
        if (roleId == EMPLOYEE_ROLE_ID) {
            return defaultAllowedForEmployee(moduleKey, actionKey);
        }
        return false;
    }

    private boolean defaultAllowedForHr(String moduleKey, String actionKey) {
        if ("CONTINUOUS_FEEDBACK".equals(moduleKey)) {
            return Set.of("view", "comment", "view_private_notes", "report").contains(actionKey);
        }
        return true;
    }

    private boolean defaultAllowedForManager(String moduleKey, String actionKey) {
        return switch (moduleKey) {
            case "KPI" -> Set.of("view", "manage", "assign", "history", "report", "export").contains(actionKey);
            case "360_FEEDBACK" -> Set.of("view", "give", "review_history", "report", "export").contains(actionKey);
            case "PIP" -> Set.of("view", "create", "update", "schedule_meeting", "close_reopen", "report", "export").contains(actionKey);
            case "SELF_ASSESSMENT" -> Set.of("view", "manage_templates", "review", "history", "report", "export").contains(actionKey);
            case "MEETINGS" -> Set.of("view", "schedule", "request", "reschedule", "cancel", "approve_cancel", "finish", "notes", "history").contains(actionKey);
            case "REPORTS" -> Set.of("view", "performance_report", "kpi_report", "feedback_report", "appraisal_report", "self_assessment_report", "pip_report", "export").contains(actionKey);
            case "EMPLOYEE_PROFILE" -> Set.of("view_employee", "view_org_setup").contains(actionKey);
            case "CONTINUOUS_FEEDBACK" -> Set.of("view", "create", "comment", "manage_action_items", "create_followup_meeting", "create_pip", "view_private_notes", "report").contains(actionKey);
            default -> false;
        };
    }

    private boolean defaultAllowedForEmployee(String moduleKey, String actionKey) {
        return switch (moduleKey) {
            case "KPI" -> Set.of("view", "history").contains(actionKey);
            case "360_FEEDBACK" -> Set.of("view", "give", "review_history").contains(actionKey);
            case "PIP" -> Set.of("view", "review_notes", "schedule_meeting").contains(actionKey);
            case "SELF_ASSESSMENT" -> Set.of("view", "review", "history").contains(actionKey);
            case "MEETINGS" -> Set.of("view", "request", "reschedule", "cancel", "notes", "history").contains(actionKey);
            case "REPORTS" -> Set.of("view", "feedback_report", "pip_report", "export").contains(actionKey);
            case "EMPLOYEE_PROFILE" -> Set.of("view_employee").contains(actionKey);
            case "CONTINUOUS_FEEDBACK" -> Set.of("view", "comment", "acknowledge").contains(actionKey);
            default -> false;
        };
    }
}
