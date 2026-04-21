package com.epms.backend.controller;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.kpi.PositionKpiDto;
import com.epms.backend.dto.kpi.PositionKpiRequestDto;
import com.epms.backend.entity.*;
import com.epms.backend.service.KpiManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/kpi-management")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('HR', 'MANAGER')")
public class KpiManagementController {

    private final KpiManagementService kpiManagementService;

    // Categories
    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<KpiCategory>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.ok("Categories fetched", kpiManagementService.getAllCategories()));
    }

    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<KpiCategory>> createCategory(@RequestParam String name) {
        return ResponseEntity.ok(ApiResponse.ok("Category created", kpiManagementService.createCategory(name)));
    }

    // Position KPI Definitions
    @GetMapping("/positions/{positionId}/kpis")
    public ResponseEntity<ApiResponse<List<PositionKpiDto>>> getPositionKpis(@PathVariable Long positionId) {
        return ResponseEntity.ok(ApiResponse.ok("Position KPIs fetched", 
                kpiManagementService.getPositionKpisWithPositionName(positionId)));
    }

    @PostMapping("/positions/kpis")
    public ResponseEntity<ApiResponse<List<PositionKpiDefinition>>> savePositionKpis(@RequestBody PositionKpiRequestDto request) {
        List<PositionKpiDefinition> saved = kpiManagementService.savePositionKpis(request);
        return ResponseEntity.ok(ApiResponse.ok("KPIs saved successfully", saved));
    }

    @DeleteMapping("/positions/kpis/{kpiId}")
    public ResponseEntity<ApiResponse<Void>> deletePositionKpi(@PathVariable Long kpiId) {
        kpiManagementService.deletePositionKpi(kpiId);
        return ResponseEntity.ok(ApiResponse.ok("KPI deleted", null));
    }

    // Positions list
    @GetMapping("/positions")
    public ResponseEntity<ApiResponse<List<Position>>> getPositions() {
        return ResponseEntity.ok(ApiResponse.ok("Positions fetched", kpiManagementService.getAllPositions()));
    }

    // Employees list
    @GetMapping("/employees")
    public ResponseEntity<ApiResponse<List<Employee>>> getEmployees() {
        return ResponseEntity.ok(ApiResponse.ok("Employees fetched", kpiManagementService.getAllEmployees()));
    }

    // Employee KPIs with actuals
    @GetMapping("/employees/{employeeId}/kpis")
    public ResponseEntity<ApiResponse<List<PositionKpiDto>>> getEmployeeKpis(@PathVariable Long employeeId) {
        return ResponseEntity.ok(ApiResponse.ok("Employee KPIs fetched", kpiManagementService.getEmployeeKpisWithActuals(employeeId)));
    }

    @PostMapping("/employees/{employeeId}/actuals")
    public ResponseEntity<ApiResponse<Void>> updateActualValues(@PathVariable Long employeeId, @RequestBody List<PositionKpiDto> updates) {
        kpiManagementService.updateEmployeeActualValues(employeeId, updates);
        return ResponseEntity.ok(ApiResponse.ok("Actual values updated", null));
    }

    @PostMapping("/employees/{employeeId}/lock")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<ApiResponse<Void>> lockKpis(@PathVariable Long employeeId) {
        kpiManagementService.lockEmployeeKpis(employeeId);
        return ResponseEntity.ok(ApiResponse.ok("KPIs locked", null));
    }
}
