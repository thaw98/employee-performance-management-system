// HrKpiController.java
package com.epms.backend.controller;

import com.epms.backend.dto.KpiUpdateDTO;
import com.epms.backend.dto.kpi.BulkKpiAssignmentDTO;
import com.epms.backend.dto.kpi.KpiCreateDTO;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.KpiRecord;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.security.UserPrincipal;
import com.epms.backend.service.KpiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hr/kpi")
@RequiredArgsConstructor
public class HrKpiController {

    private final KpiService kpiService;
    private final EmployeeRepository employeeRepository;

    @PostMapping("/employee/{employeeId}")
    public ResponseEntity<Map<String, Object>> createEmployeeKpis(
            @PathVariable Long employeeId,
            @RequestParam(required = false) Long periodId,
            @RequestBody BulkKpiAssignmentDTO request,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        Employee hrUser = employeeRepository.findById(principal.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<KpiRecord> records = kpiService.createKpisForEmployee(
                employeeId, 
                periodId, 
                request.getKpis(), 
                hrUser,
                request.isFinal()
        );

        BigDecimal totalWeight = records.stream()
                .map(KpiRecord::getWeight)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", String.format("Successfully created %d KPI records", records.size()));
        response.put("data", records);
        response.put("totalWeight", totalWeight);

        return ResponseEntity.ok(response);
    }

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

    @PostMapping("/employee/{employeeId}/lock")
    public ResponseEntity<Map<String, Object>> lockEmployeeKpis(
            @PathVariable Long employeeId,
            @RequestParam(required = false) Long periodId,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        Employee hrUser = employeeRepository.findById(principal.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        kpiService.lockKpiBatch(employeeId, periodId, hrUser);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "KPI records locked successfully");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<Map<String, Object>> getEmployeeKpis(
            @PathVariable Long employeeId,
            @RequestParam(required = false) Long periodId) {
        
        List<KpiRecord> records = kpiService.getKpisByEmployee(employeeId, periodId);
        
        BigDecimal totalWeight = records.stream()
                .map(KpiRecord::getWeight)
                .filter(w -> w != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalScore = records.stream()
                .map(KpiRecord::getWeightedScore)
                .filter(s -> s != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", records);
        response.put("count", records.size());
        response.put("totalWeight", totalWeight);
        response.put("totalScore", totalScore);
        response.put("isComplete", totalWeight.compareTo(new BigDecimal("100")) == 0);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/validate-weight")
    public ResponseEntity<Map<String, Object>> validateWeight(@RequestBody List<KpiCreateDTO> kpis) {
        BigDecimal totalWeight = kpis.stream()
                .map(KpiCreateDTO::getWeight)
                .filter(w -> w != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        boolean isValid = totalWeight.compareTo(new BigDecimal("100")) == 0;
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("totalWeight", totalWeight);
        response.put("isValid", isValid);
        response.put("message", isValid ? "Weight validation passed" : "Total weight must equal 100%");
        
        return ResponseEntity.ok(response);
    }
}