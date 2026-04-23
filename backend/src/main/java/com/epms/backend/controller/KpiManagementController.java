package com.epms.backend.controller;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.kpi.PositionKpiDto;
import com.epms.backend.dto.kpi.PositionKpiRequestDto;
import com.epms.backend.entity.*;
import com.epms.backend.service.KpiManagementService;
import com.epms.backend.service.KpiService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/kpi-management")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('HR', 'MANAGER')")
public class KpiManagementController {

    private final KpiManagementService kpiManagementService;
    private KpiService kpiService;

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
    
 // Add these methods to KpiManagementController.java

    /**
     * FR-KPI-VAL: Validate KPI weights before submission for position KPIs
     */
    @PostMapping("/positions/validate-weights")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validatePositionKpiWeights(@RequestBody PositionKpiRequestDto request) {
        BigDecimal totalWeight = request.getKpis().stream()
                .map(PositionKpiDto::getWeight)
                .filter(w -> w != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        boolean isValid = totalWeight.compareTo(new BigDecimal("100")) == 0;
        String message;
        
        if (isValid) {
            message = "Weight validation passed. Total weight is 100%.";
        } else if (totalWeight.compareTo(new BigDecimal("100")) < 0) {
            message = String.format("Total KPI weight is %.2f%%. Please add %.2f%% more weight.", 
                    totalWeight, new BigDecimal("100").subtract(totalWeight));
        } else {
            message = String.format("Total KPI weight is %.2f%%. Please reduce by %.2f%%.", 
                    totalWeight, totalWeight.subtract(new BigDecimal("100")));
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("totalWeight", totalWeight);
        result.put("isValid", isValid);
        result.put("message", message);
        
        return ResponseEntity.ok(ApiResponse.ok("Weight validation completed", result));
    }

    /**
     * Get revision history for an employee's KPI
     */
    @GetMapping("/employees/{employeeId}/kpis/{kpiAssignmentId}/revisions")
    @PreAuthorize("hasAnyRole('HR', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<KpiRevision>>> getKpiRevisionHistory(
            @PathVariable Long employeeId,
            @PathVariable Long kpiAssignmentId) {
        
        // Find the KpiRecord associated with this assignment
        List<KpiRecord> records = kpiService.getKpisByEmployee(employeeId, null);
        KpiRecord record = records.stream()
                .filter(r -> r.getId().equals(kpiAssignmentId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("KPI record not found"));
        
        List<KpiRevision> history = kpiService.getRevisionHistory(record.getId());
        return ResponseEntity.ok(ApiResponse.ok("Revision history fetched", history));
    }
}
