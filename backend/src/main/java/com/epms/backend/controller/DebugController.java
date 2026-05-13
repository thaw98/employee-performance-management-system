package com.epms.backend.controller;

import com.epms.backend.security.UserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;

@RestController
@RequestMapping("/api/debug")
public class DebugController {
    private final com.epms.backend.repository.UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;
    public DebugController(com.epms.backend.repository.UserRepository userRepository, JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.jdbcTemplate = jdbcTemplate;
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
