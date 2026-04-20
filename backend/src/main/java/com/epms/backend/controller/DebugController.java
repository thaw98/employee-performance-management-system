package com.epms.backend.controller;

import com.epms.backend.security.UserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/debug")
public class DebugController {
    private final com.epms.backend.repository.UserRepository userRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    public DebugController(com.epms.backend.repository.UserRepository userRepository, org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
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

    @GetMapping("/migrate-db")
    public String migrateDb() {
        try {
            jdbcTemplate.execute("ALTER TABLE self_assessment_records MODIFY employee_signature MEDIUMTEXT");
            jdbcTemplate.execute("ALTER TABLE self_assessment_records MODIFY manager_signature MEDIUMTEXT");
            jdbcTemplate.execute("ALTER TABLE self_assessment_records MODIFY hr_signature MEDIUMTEXT");
            return "Migration successful!";
        } catch (Exception e) {
            return "Error migrating DB: " + e.getMessage();
        }
    }
}
