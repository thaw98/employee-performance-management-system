package com.epms.backend.controller;

import com.epms.backend.security.UserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import com.epms.backend.entity.*;

@RestController
@RequestMapping("/api/debug")
public class DebugController {
    private final com.epms.backend.repository.UserRepository userRepository;
    private final com.epms.backend.repository.EmployeeRepository employeeRepository;
    private final JdbcTemplate jdbcTemplate;
    private final com.epms.backend.repository.AppraisalTemplateRepository templateRepository;
    private final com.epms.backend.repository.AppraisalCycleRepository appraisalCycleRepository;
    private final com.epms.backend.repository.ReviewCycleRepository reviewCycleRepository;
    private final com.epms.backend.repository.AppraisalAssignmentRepository assignmentRepository;
    private final com.epms.backend.service.NotificationService notificationService;

    public DebugController(
            com.epms.backend.repository.UserRepository userRepository, 
            com.epms.backend.repository.EmployeeRepository employeeRepository, 
            JdbcTemplate jdbcTemplate,
            com.epms.backend.repository.AppraisalTemplateRepository templateRepository,
            com.epms.backend.repository.AppraisalCycleRepository appraisalCycleRepository,
            com.epms.backend.repository.ReviewCycleRepository reviewCycleRepository,
            com.epms.backend.repository.AppraisalAssignmentRepository assignmentRepository,
            com.epms.backend.service.NotificationService notificationService) {
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.templateRepository = templateRepository;
        this.appraisalCycleRepository = appraisalCycleRepository;
        this.reviewCycleRepository = reviewCycleRepository;
        this.assignmentRepository = assignmentRepository;
        this.notificationService = notificationService;
    }

    @GetMapping("/auth-check")
    public Map<String, Object> checkAuth(@AuthenticationPrincipal UserPrincipal principal) {
        Map<String, Object> map = new HashMap<>();
        map.put("total_users", userRepository.count());
        if (principal == null) {
            map.put("authenticated", false);
        } else {
            map.put("authenticated", true);
            map.put("id", principal.getId());
            map.put("email", principal.getEmail());
            map.put("authorities", principal.getAuthorities());
        }
        return map;
    }

    @GetMapping("/test-counts")
    public java.util.List<Object[]> testCounts() {
        return employeeRepository.countActiveEmployeesPerDepartmentAndPosition();
    }

    @GetMapping("/distribute-trace")
    public Map<String, Object> distributeTrace(@org.springframework.web.bind.annotation.RequestParam(required = false) Long templateId) {
        java.util.List<String> logs = new java.util.ArrayList<>();
        Map<String, Object> result = new HashMap<>();
        try {
            logs.add("Trace starting...");
            
            AppraisalTemplate template;
            if (templateId != null) {
                logs.add("Fetching template by ID: " + templateId);
                template = templateRepository.findById(templateId).orElse(null);
            } else {
                logs.add("Fetching last active template...");
                java.util.List<AppraisalTemplate> activeTemplates = templateRepository.findAllByIsActiveTrue();
                template = activeTemplates.isEmpty() ? null : activeTemplates.get(activeTemplates.size() - 1);
            }

            if (template == null) {
                logs.add("ERROR: No template found!");
                result.put("logs", logs);
                return result;
            }

            logs.add("Found template: ID=" + template.getId() + ", Name=" + template.getName());

            if (template.getTargetDepartmentPositions() == null || template.getTargetDepartmentPositions().isEmpty()) {
                logs.add("ERROR: Target positions empty!");
                result.put("logs", logs);
                return result;
            }

            logs.add("Target positions count: " + template.getTargetDepartmentPositions().size());

            java.util.List<AppraisalCycle> activeCycles = appraisalCycleRepository.findByStatusIgnoreCase("Active");
            AppraisalCycle activeCycle = activeCycles.isEmpty() ? null : activeCycles.get(activeCycles.size() - 1);

            if (template.getReviewCycleId() != null) {
                logs.add("Template has reviewCycleId: " + template.getReviewCycleId());
                ReviewCycle rc = reviewCycleRepository.findById(template.getReviewCycleId()).orElse(null);
                if (rc != null) {
                    logs.add("Found ReviewCycle: " + rc.getName());
                    activeCycle = appraisalCycleRepository.findByName(rc.getName()).stream().findFirst().orElse(null);
                    if (activeCycle == null) {
                        logs.add("Creating new AppraisalCycle for ReviewCycle: " + rc.getName());
                        activeCycle = new AppraisalCycle();
                        activeCycle.setName(rc.getName());
                        activeCycle.setStatus("Active");
                        activeCycle.setStartDate(rc.getStartDate());
                        activeCycle.setEndDate(rc.getEndDate());
                        activeCycle = appraisalCycleRepository.save(activeCycle);
                    } else {
                        logs.add("Using existing AppraisalCycle: " + activeCycle.getName());
                    }
                } else {
                    logs.add("ReviewCycle not found in DB!");
                }
            }

            if (activeCycle == null) {
                logs.add("No active cycle, creating default...");
                AppraisalCycle cycle = new AppraisalCycle();
                cycle.setName(template.getName() != null ? template.getName() : "Annual Appraisal " + java.time.LocalDate.now().getYear());
                cycle.setStatus("Active");
                cycle.setStartDate(java.time.LocalDate.now());
                cycle.setEndDate(template.getDeadlineDate() != null ? template.getDeadlineDate() : java.time.LocalDate.now().plusMonths(1));
                activeCycle = appraisalCycleRepository.save(cycle);
            }

            logs.add("Active AppraisalCycle: ID=" + activeCycle.getId() + ", Name=" + activeCycle.getName());

            int count = 0;
            java.util.Set<Long> notifiedManagers = new java.util.HashSet<>();

            for (DepartmentPosition mapping : template.getTargetDepartmentPositions()) {
                Department dept = mapping.getDepartment();
                if (dept == null) {
                    logs.add("Mapping ID=" + mapping.getId() + " - Department is null!");
                    continue;
                }

                logs.add("Processing mapping ID=" + mapping.getId() + " for Department=" + dept.getName() + " and Position=" + mapping.getPosition().getName());

                if (dept.getManagerId() == null) {
                    logs.add("  WARNING: Department Head (manager_id) is NULL for " + dept.getName());
                    continue;
                }

                Employee departmentHead = employeeRepository.findById(dept.getManagerId()).orElse(null);
                if (departmentHead == null) {
                    logs.add("  WARNING: Department Head Employee not found for manager_id=" + dept.getManagerId());
                    continue;
                }

                logs.add("  Department Head: " + departmentHead.getEmployeeName() + " (ID=" + departmentHead.getId() + ", Email=" + departmentHead.getEmail() + ")");

                // Try to find the manager user account early
                User managerUser = userRepository.findByEmployee_Id(departmentHead.getId())
                    .orElseGet(() -> {
                        if (departmentHead.getEmail() != null) {
                            return userRepository.findFirstByEmployee_EmailIgnoreCaseOrderByActiveDescIdAsc(departmentHead.getEmail()).orElse(null);
                        }
                        return null;
                    });

                if (managerUser == null) {
                    logs.add("  WARNING: User account NOT found for Manager " + departmentHead.getEmployeeName() + " (Employee ID=" + departmentHead.getId() + ")");
                } else {
                    logs.add("  User Account Found: UserID=" + managerUser.getId() + ", Email=" + managerUser.getEmail() + ", Active=" + managerUser.isActive());
                }

                java.util.List<Employee> employees = employeeRepository.findByDepartment_IdAndPosition_Id(dept.getId(), mapping.getPosition().getId());
                logs.add("  Found " + employees.size() + " employees in this department-position mapping");

                boolean hasAssignmentsInThisMapping = false;

                for (Employee employee : employees) {
                    if (employee.getId().equals(departmentHead.getId())) {
                        logs.add("    Skipping employee " + employee.getEmployeeName() + " because they are the Department Head");
                        continue;
                    }

                    logs.add("    Creating assignment for employee: " + employee.getEmployeeName() + " (ID=" + employee.getId() + ")");

                    AppraisalAssignment assignment = assignmentRepository
                            .findByEmployee_IdAndPeriod_Id(employee.getId(), activeCycle.getId())
                            .orElse(new AppraisalAssignment());

                    assignment.setEmployee(employee);
                    assignment.setPeriod(activeCycle);
                    assignment.setTemplate(template);
                    assignment.setEvaluator(departmentHead);
                    assignment.setStatus(AppraisalStatus.PENDING_MANAGER);
                    assignment.setUpdatedAt(java.time.Instant.now());

                    assignmentRepository.save(assignment);
                    count++;
                    hasAssignmentsInThisMapping = true;
                }

                if (hasAssignmentsInThisMapping) {
                    if (managerUser != null) {
                        if (!notifiedManagers.contains(departmentHead.getId())) {
                            logs.add("  Attempting to send notification to Manager: UserID=" + managerUser.getId() + ", Email=" + managerUser.getEmail());
                            try {
                                String title = "New Appraisals Assigned";
                                String message = String.format("HR has distributed the '%s' appraisal forms. You have new appraisals to evaluate for %s department.", 
                                    template.getName(), dept.getName());
                                logs.add("    Calling notificationService.send...");
                                com.epms.backend.dto.NotificationDto dto = notificationService.send(managerUser, title, message, "APPRAISAL", template.getId());
                                logs.add("    SUCCESS: Notification sent! Notification ID=" + dto.id() + ", Recipient=" + dto.userId());
                                notifiedManagers.add(departmentHead.getId());
                            } catch (Exception e) {
                                logs.add("    ERROR sending notification: " + e.getMessage());
                                java.io.StringWriter sw = new java.io.StringWriter();
                                e.printStackTrace(new java.io.PrintWriter(sw));
                                logs.add("    Stacktrace: " + sw.toString());
                            }
                        } else {
                            logs.add("  Manager " + departmentHead.getEmployeeName() + " was ALREADY notified in a previous mapping, skipping duplicate");
                        }
                    } else {
                        logs.add("  CANNOT send notification: Manager User Account is null");
                    }
                } else {
                    logs.add("  No assignments created for mapping ID=" + mapping.getId());
                }
            }

            logs.add("Trace completed. Created " + count + " assignments.");
            result.put("success", true);
            result.put("assignmentsCreated", count);
        } catch (Exception e) {
            logs.add("GLOBAL EXCEPTION: " + e.getMessage());
            java.io.StringWriter sw = new java.io.StringWriter();
            e.printStackTrace(new java.io.PrintWriter(sw));
            logs.add("Stacktrace: " + sw.toString());
            result.put("success", false);
        }
        result.put("logs", logs);
        return result;
    }

    @GetMapping("/users-dump")
    public java.util.List<Map<String, Object>> dumpUsers() {
        return userRepository.findAll().stream().map(u -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("email", u.getEmail());
            m.put("isActive", u.isActive());
            m.put("hasEmployee", u.getEmployee() != null);
            if (u.getEmployee() != null) {
                m.put("employeeId", u.getEmployee().getId());
                m.put("employeeName", u.getEmployee().getEmployeeName());
            }
            return m;
        }).collect(java.util.stream.Collectors.toList());
    }

    @GetMapping("/query")
    public java.util.List<Map<String, Object>> query(@org.springframework.web.bind.annotation.RequestParam String sql) {
        try {
            return jdbcTemplate.queryForList(sql);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return java.util.Collections.singletonList(error);
        }
    }

    @GetMapping("/execute-sql")
    public String executeSql(@org.springframework.web.bind.annotation.RequestParam String sql) {
        try {
            jdbcTemplate.execute(sql);
            return "SQL executed successfully: " + sql;
        } catch (Exception e) {
            return "Error executing SQL: " + e.getMessage();
        }
    }

    @GetMapping("/check-user")
    public Map<String, Object> checkUser(@org.springframework.web.bind.annotation.RequestParam String email) {
        try {
            java.util.List<Map<String, Object>> users = jdbcTemplate.queryForList(
                "SELECT u.user_id, u.employee_id as emp_db_id, e.full_name, e.department_id, r.role_name " +
                "FROM user_account u " +
                "JOIN role r ON u.role_id = r.id " +
                "JOIN employee e ON u.employee_id = e.employee_id " +
                "WHERE e.email = ?", email);
            if (users.isEmpty()) return new HashMap<>();
            return users.get(0);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return error;
        }
    }

    @GetMapping("/dept-heads")
    public java.util.List<Map<String, Object>> getDeptHeads() {
        return jdbcTemplate.queryForList("SELECT d.department_id, d.department_name, d.manager_id, e.full_name as head_name FROM department d LEFT JOIN employee e ON d.manager_id = e.employee_id");
    }

    @GetMapping("/evaluator-assignments")
    public java.util.List<Map<String, Object>> getEvaluatorAssignments(@org.springframework.web.bind.annotation.RequestParam Long id) {
        return jdbcTemplate.queryForList(
            "SELECT aa.id, e.full_name as employee_name, d.department_name, aa.status, ev.full_name as evaluator_name, aa.template_id " +
            "FROM appraisal_assignments aa " +
            "JOIN employee e ON aa.employee_id = e.employee_id " +
            "JOIN department d ON e.department_id = d.department_id " +
            "LEFT JOIN employee ev ON aa.evaluator_id = ev.employee_id " +
            "WHERE aa.evaluator_id = ?", id);
    }

    @GetMapping("/templates")
    public java.util.List<Map<String, Object>> getTemplates() {
        return jdbcTemplate.queryForList("SELECT id, name, is_active, max_rating FROM appraisal_templates ORDER BY id DESC");
    }
}
