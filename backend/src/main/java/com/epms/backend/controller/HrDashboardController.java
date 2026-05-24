package com.epms.backend.controller;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.hr.HrDashboardSummaryDto;
import com.epms.backend.service.HrDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/hr/dashboard")
public class HrDashboardController {
    private final HrDashboardService hrDashboardService;

    public HrDashboardController(HrDashboardService hrDashboardService) {
        this.hrDashboardService = hrDashboardService;
    }

    @GetMapping
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<ApiResponse<HrDashboardSummaryDto>> getSummary() {
        return ResponseEntity.ok(ApiResponse.ok("HR dashboard summary fetched successfully.", hrDashboardService.getSummary()));
    }
}
