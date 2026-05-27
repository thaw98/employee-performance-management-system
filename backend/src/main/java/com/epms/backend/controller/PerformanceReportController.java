package com.epms.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.PerformanceReportSummaryDto;
import com.epms.backend.service.PerformanceReportService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/performance-reports")
@RequiredArgsConstructor
public class PerformanceReportController {

    private final PerformanceReportService reportService;

    @GetMapping("/summaries")
    @PreAuthorize("hasAnyRole('HR', 'DEPARTMENT_HEAD', 'TEAM_HEAD', 'AUDIT') or principal.roleId == 5")
    public ResponseEntity<ApiResponse<List<PerformanceReportSummaryDto>>> getAllSummaries() {
        List<PerformanceReportSummaryDto> data = reportService.getAllEmployeeReportSummaries();
        return ResponseEntity.ok(ApiResponse.ok("Performance report summaries retrieved successfully", data));
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyRole('HR', 'DEPARTMENT_HEAD', 'TEAM_HEAD', 'AUDIT') or principal.roleId == 5")
    public ResponseEntity<ApiResponse<PerformanceReportSummaryDto>> getEmployeeSummary(
            @PathVariable Long employeeId) {
        PerformanceReportSummaryDto data = reportService.getEmployeeReportSummary(employeeId);
        return ResponseEntity.ok(ApiResponse.ok("Employee performance report retrieved successfully", data));
    }
}
