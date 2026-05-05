package com.epms.backend.controller;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.AuditLogDto;
import com.epms.backend.entity.AuditLog;
import com.epms.backend.repository.AuditLogRepository;
import com.epms.backend.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('HR')")
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;
    private final AuditService auditService;

    @GetMapping("/target/{type}/{id}")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getByTarget(@PathVariable String type, @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Fetched audit logs", 
                auditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(type, id)));
    }

    @GetMapping("/kpi")
    public ResponseEntity<ApiResponse<List<AuditLogDto>>> getKpiLogs() {
        return ResponseEntity.ok(ApiResponse.ok("Fetched KPI audit logs", auditService.getKpiAuditLogs()));
    }
}
