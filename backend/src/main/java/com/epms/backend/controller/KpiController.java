// KpiController.java - Fixed version
package com.epms.backend.controller;

import com.epms.backend.dto.KpiUpdateDTO;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.KpiRecord;
import com.epms.backend.entity.KpiRevision;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.security.UserPrincipal;
import com.epms.backend.service.KpiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/kpi")
@RequiredArgsConstructor
public class KpiController {

    private final KpiService kpiService;
    private final EmployeeRepository employeeRepository;

    /**
     * Get KPIs by employee
     */
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<Map<String, Object>> getEmployeeKpis(
            @PathVariable Long employeeId,
            @RequestParam(required = false) Long periodId) {
        
        List<KpiRecord> records = kpiService.getKpisByEmployee(employeeId, periodId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", records);
        response.put("count", records.size());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Update actual value for a KPI
     */
    @PutMapping("/record/{kpiId}/actual")
    public ResponseEntity<Map<String, Object>> updateActualValue(
            @PathVariable Long kpiId,
            @RequestBody KpiUpdateDTO update,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        Employee currentUser = employeeRepository.findById(principal.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isHr = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_HR"));
        
        boolean isManager = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER"));

        KpiRecord updated = kpiService.updateActualValue(kpiId, update, currentUser, isHr, isManager);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "KPI actual value updated successfully");
        response.put("data", updated);
        response.put("calculatedScore", updated.getScore());
        response.put("weightedScore", updated.getWeightedScore());

        return ResponseEntity.ok(response);
    }

    /**
     * Save KPI batch (draft or final)
     */
    @PostMapping("/batch")
    public ResponseEntity<Map<String, Object>> saveKpiBatch(
            @RequestBody List<KpiRecord> records,
            @RequestParam boolean isFinal,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        Employee currentUser = employeeRepository.findById(principal.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<KpiRecord> saved = kpiService.saveKpiBatch(records, isFinal, currentUser.getEmployeeName());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", isFinal ? "KPIs submitted successfully" : "KPIs saved as draft");
        response.put("data", saved);
        response.put("count", saved.size());

        return ResponseEntity.ok(response);
    }

    /**
     * Lock KPI batch (HR only)
     */
    @PostMapping("/lock")
    public ResponseEntity<Map<String, Object>> lockKpiBatch(
            @RequestParam Long employeeId,
            @RequestParam(required = false) Long periodId,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        Employee hrUser = employeeRepository.findById(principal.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify HR role
        boolean isHr = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_HR"));
        
        if (!isHr) {
            throw new RuntimeException("Only HR can lock KPI records");
        }

        kpiService.lockKpiBatch(employeeId, periodId, hrUser);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "KPI records locked successfully");

        return ResponseEntity.ok(response);
    }

    /**
     * Approve KPI batch (HR only)
     */
    @PostMapping("/approve")
    public ResponseEntity<Map<String, Object>> approveKpiBatch(
            @RequestParam Long employeeId,
            @RequestParam(required = false) Long periodId,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        Employee hrUser = employeeRepository.findById(principal.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isHr = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_HR"));
        
        if (!isHr) {
            throw new RuntimeException("Only HR can approve KPI records");
        }

        kpiService.approveKpiBatch(employeeId, periodId, hrUser.getEmployeeName());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "KPI records approved successfully");

        return ResponseEntity.ok(response);
    }

    /**
     * Revise a KPI
     */
    @PutMapping("/record/{kpiId}/revise")
    public ResponseEntity<Map<String, Object>> reviseKpi(
            @PathVariable Long kpiId,
            @RequestBody KpiRecord revisedData,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        Employee currentUser = employeeRepository.findById(principal.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        KpiRecord revised = kpiService.reviseKpi(kpiId, revisedData, currentUser.getId(), currentUser.getEmployeeName());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "KPI revised successfully");
        response.put("data", revised);

        return ResponseEntity.ok(response);
    }

    /**
     * Get revision history for a KPI
     */
    @GetMapping("/record/{kpiId}/history")
    public ResponseEntity<Map<String, Object>> getRevisionHistory(@PathVariable Long kpiId) {
        List<KpiRevision> history = kpiService.getRevisionHistory(kpiId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", history);
        response.put("count", history.size());

        return ResponseEntity.ok(response);
    }
}