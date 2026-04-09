package com.epms.backend.controller;

import com.epms.backend.entity.KpiAuditLog;
import com.epms.backend.repository.KpiAuditLogRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

//MNA
@RestController
@RequestMapping("/api/v1/kpis/audit-logs")
public class KpiAuditLogController {

    private final KpiAuditLogRepository kpiAuditLogRepository;

    public KpiAuditLogController(KpiAuditLogRepository kpiAuditLogRepository) {
        this.kpiAuditLogRepository = kpiAuditLogRepository;
    }

    /**
     * KM-12: View Audit Logs in descending order.
     */
    @GetMapping
    public ResponseEntity<List<KpiAuditLog>> getAllLogs() {
        return ResponseEntity.ok(kpiAuditLogRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")));
    }
}
