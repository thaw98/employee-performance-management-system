package com.epms.backend.controller;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.AuditLogDto;
import com.epms.backend.service.AuditService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@RestController
@RequestMapping("/api/audit/activity")
@RequiredArgsConstructor
@PreAuthorize("principal.roleId == 5")
public class AuditActivityController {

    private final AuditService auditService;
    private final ExecutorService sseExecutor = Executors.newSingleThreadExecutor();

    @GetMapping("/events")
    public ResponseEntity<ApiResponse<List<AuditLogDto>>> getEvents() {
        List<AuditLogDto> logs = auditService.getAllAuditLogs();
        List<AuditLogDto> recentLogs = logs.stream().limit(30).toList();
        return ResponseEntity.ok(ApiResponse.ok("Fetched activity events", recentLogs));
    }

    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<List<UserSessionDto>>> getSessions() {
        List<UserSessionDto> sessions = List.of(
            new UserSessionDto("1", "Phyu Phyu Thin", "hr.phyu@acedatasystems.com", "HR Manager", "192.168.1.102", "Chrome/Windows", Instant.now().minusSeconds(300)),
            new UserSessionDto("2", "Su Su Lwin", "susulwin@acedatasystems.com", "Project Manager", "192.168.1.155", "Safari/macOS", Instant.now().minusSeconds(120)),
            new UserSessionDto("3", "Thura Linn", "thura@acedatasystems.com", "Senior Developer", "192.168.1.189", "Firefox/Linux", Instant.now().minusSeconds(600)),
            new UserSessionDto("4", "Audit Inspector", "audit@acedatasystems.com", "Security Auditor", "192.168.1.1", "Chrome/Windows", Instant.now().minusSeconds(10))
        );
        return ResponseEntity.ok(ApiResponse.ok("Fetched active user sessions", sessions));
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<SystemHealthDto>> getHealth() {
        SystemHealthDto health = new SystemHealthDto(
            98.5,
            12.5,
            45.8,
            88.2,
            new SystemHealthDto.DatabasePool(5, 15, 20),
            124L
        );
        return ResponseEntity.ok(ApiResponse.ok("Fetched system health metrics", health));
    }

    @GetMapping("/security-alerts")
    public ResponseEntity<ApiResponse<List<SecurityAlertDto>>> getSecurityAlerts() {
        List<SecurityAlertDto> alerts = List.of(
            new SecurityAlertDto("1", "HIGH", "Brute-force login attempt detected", "192.168.1.205", "Unknown", Instant.now().minusSeconds(1800)),
            new SecurityAlertDto("2", "MEDIUM", "Unauthorized access attempt to HR records", "192.168.1.189", "su.su", Instant.now().minusSeconds(3600)),
            new SecurityAlertDto("3", "LOW", "Session lifetime warning for user #3", "192.168.1.102", "thura", Instant.now().minusSeconds(7200))
        );
        return ResponseEntity.ok(ApiResponse.ok("Fetched security alerts", alerts));
    }

    @GetMapping("/resources")
    public ResponseEntity<ApiResponse<List<ResourceMetricDto>>> getResources() {
        List<ResourceMetricDto> metrics = new ArrayList<>();
        Instant now = Instant.now();
        for (int i = 9; i >= 0; i--) {
            metrics.add(new ResourceMetricDto(
                now.minusSeconds(i * 30).toString(),
                10.0 + Math.random() * 15,
                40.0 + Math.random() * 5,
                5.0 + Math.random() * 10
            ));
        }
        return ResponseEntity.ok(ApiResponse.ok("Fetched resource utilization metrics", metrics));
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamEvents() {
        SseEmitter emitter = new SseEmitter(180000L);
        sseExecutor.execute(() -> {
            try {
                emitter.send(SseEmitter.event().name("connect").data("Connected to EPMS Activity Stream"));
                for (int i = 0; i < 20; i++) {
                    Thread.sleep(8000);
                    Map<String, Object> mockEvent = new HashMap<>();
                    mockEvent.put("timestamp", Instant.now().toString());
                    mockEvent.put("cpu", 10.0 + Math.random() * 15);
                    mockEvent.put("memory", 40.0 + Math.random() * 5);
                    mockEvent.put("activeSessions", 3 + (int)(Math.random() * 3));
                    emitter.send(SseEmitter.event().name("activity-update").data(mockEvent));
                }
                emitter.complete();
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        });
        return emitter;
    }

    @Data
    @AllArgsConstructor
    public static class UserSessionDto {
        private String sessionId;
        private String userName;
        private String email;
        private String role;
        private String ipAddress;
        private String userAgent;
        private Instant loginTime;
    }

    @Data
    @AllArgsConstructor
    public static class SystemHealthDto {
        private double uptime;
        private double cpuUsage;
        private double memoryUsage;
        private double diskUsage;
        private DatabasePool dbPool;
        private long activeThreads;

        @Data
        @AllArgsConstructor
        public static class DatabasePool {
            private int activeConnections;
            private int idleConnections;
            private int maxConnections;
        }
    }

    @Data
    @AllArgsConstructor
    public static class SecurityAlertDto {
        private String alertId;
        private String severity;
        private String message;
        private String ipAddress;
        private String username;
        private Instant timestamp;
    }

    @Data
    @AllArgsConstructor
    public static class ResourceMetricDto {
        private String timestamp;
        private double cpu;
        private double ram;
        private double dbLoad;
    }
}
