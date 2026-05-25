package com.epms.backend.controller;

import com.epms.backend.dto.KpiDto;
import com.epms.backend.dto.PositionKpiDto;
import com.epms.backend.dto.DepartmentKpiDto;
import com.epms.backend.service.KpiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.access.prepost.PreAuthorize;
import java.util.List;

@RestController
@RequestMapping("/api/kpis")
public class KpiController {

    private final KpiService kpiService;

    public KpiController(KpiService kpiService) {
        this.kpiService = kpiService;
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<KpiDto>> getKpisByEmployee(@PathVariable Long employeeId, @RequestParam String period) {
        return ResponseEntity.ok(kpiService.getKpisByEmployeeAndPeriod(employeeId, period));
    }

    @GetMapping("/latest/{employeeId}")
    public ResponseEntity<List<KpiDto>> getLatestKpisByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(kpiService.getLatestKpisByEmployee(employeeId));
    }

    @GetMapping("/me/latest")
    public ResponseEntity<List<KpiDto>> getMyLatestKpis() {
        try {
            String userIdStr = org.springframework.security.core.context.SecurityContextHolder.getContext()
                    .getAuthentication().getName();
            Long userId = Long.parseLong(userIdStr);
            return ResponseEntity.ok(kpiService.getMyLatestKpis(userId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/latest-date/{employeeId}")
    public ResponseEntity<java.util.Map<String, String>> getLatestUpdatedDateByEmployee(@PathVariable Long employeeId) {
        java.time.Instant latest = kpiService.getLatestUpdatedDate(employeeId);
        return ResponseEntity.ok(java.util.Map.of("latestDate", latest != null ? latest.toString() : ""));
    }

    @GetMapping("/periods/{employeeId}")
    public ResponseEntity<List<String>> getEmployeeKpiPeriods(@PathVariable Long employeeId) {
        return ResponseEntity.ok(kpiService.getEmployeeKpiPeriods(employeeId));
    }

    @PostMapping("/setup")
    public ResponseEntity<List<KpiDto>> setupKpis(@RequestBody List<KpiDto> kpiDtos) {
        try {
            String userIdStr = org.springframework.security.core.context.SecurityContextHolder.getContext()
                    .getAuthentication().getName();
            Long userId = Long.parseLong(userIdStr);
            return ResponseEntity.ok(kpiService.saveKpis(kpiDtos, userId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    @GetMapping("/position")
    public ResponseEntity<List<PositionKpiDto>> getPositionKpis(
            @RequestParam Long departmentId,
            @RequestParam Long positionId,
            @RequestParam String period) {
        return ResponseEntity.ok(kpiService.getPositionKpis(departmentId, positionId, period));
    }

    @PostMapping("/position/setup")
    public ResponseEntity<List<PositionKpiDto>> setupPositionKpis(@RequestBody List<PositionKpiDto> dtoList) {
        try {
            String userIdStr = org.springframework.security.core.context.SecurityContextHolder.getContext()
                    .getAuthentication().getName();
            Long userId = Long.parseLong(userIdStr);
            return ResponseEntity.ok(kpiService.savePositionKpis(dtoList, userId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    @GetMapping("/department")
    public ResponseEntity<List<DepartmentKpiDto>> getDepartmentKpis(
            @RequestParam Long departmentId,
            @RequestParam String period) {
        return ResponseEntity.ok(kpiService.getDepartmentKpis(departmentId, period));
    }

    @PostMapping("/department/setup")
    public ResponseEntity<List<DepartmentKpiDto>> setupDepartmentKpis(@RequestBody List<DepartmentKpiDto> dtoList) {
        try {
            String userIdStr = org.springframework.security.core.context.SecurityContextHolder.getContext()
                    .getAuthentication().getName();
            Long userId = Long.parseLong(userIdStr);
            return ResponseEntity.ok(kpiService.saveDepartmentKpis(dtoList, userId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    @PreAuthorize("hasRole('MANAGER')")
    @PutMapping("/manager/employee/{employeeId}/actuals")
    public ResponseEntity<List<KpiDto>> updateKpiActuals(
            @PathVariable Long employeeId,
            @RequestBody List<KpiDto> kpiUpdates) {
        try {
            String userIdStr = org.springframework.security.core.context.SecurityContextHolder.getContext()
                    .getAuthentication().getName();
            Long userId = Long.parseLong(userIdStr);
            return ResponseEntity.ok(kpiService.updateKpiActualsByManager(userId, employeeId, kpiUpdates));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PreAuthorize("hasRole('HR')")
    @PutMapping("/hr/employee/{employeeId}/actuals")
    public ResponseEntity<?> updateKpiActualsByHr(
            @PathVariable Long employeeId,
            @RequestBody List<KpiDto> kpiUpdates) {
        try {
            String userIdStr = org.springframework.security.core.context.SecurityContextHolder.getContext()
                    .getAuthentication().getName();
            Long userId = Long.parseLong(userIdStr);
            return ResponseEntity.ok(kpiService.updateKpiActualsByHr(userId, employeeId, kpiUpdates));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage() != null ? e.getMessage() : "An error occurred");
        }
    }

    @PreAuthorize("hasRole('HR')")
    @PutMapping("/hr/department/{departmentId}/actuals")
    public ResponseEntity<?> updateDepartmentKpiActualsByHr(
            @PathVariable Long departmentId,
            @RequestBody List<DepartmentKpiDto> updates) {
        try {
            String userIdStr = org.springframework.security.core.context.SecurityContextHolder.getContext()
                    .getAuthentication().getName();
            Long userId = Long.parseLong(userIdStr);
            return ResponseEntity.ok(kpiService.updateDepartmentKpiActualsByHr(userId, departmentId, updates));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage() != null ? e.getMessage() : "An error occurred");
        }
    }

    @PreAuthorize("hasRole('HR')")
    @PutMapping("/hr/position/{departmentId}/{positionId}/actuals")
    public ResponseEntity<?> updatePositionKpiActualsByHr(
            @PathVariable Long departmentId,
            @PathVariable Long positionId,
            @RequestBody List<PositionKpiDto> updates) {
        try {
            String userIdStr = org.springframework.security.core.context.SecurityContextHolder.getContext()
                    .getAuthentication().getName();
            Long userId = Long.parseLong(userIdStr);
            return ResponseEntity
                    .ok(kpiService.updatePositionKpiActualsByHr(userId, departmentId, positionId, updates));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage() != null ? e.getMessage() : "An error occurred");
        }
    }

    @GetMapping("/manager/team")
    public ResponseEntity<List<java.util.Map<String, Object>>> getManagerTeam() {
        try {
            String userIdStr = org.springframework.security.core.context.SecurityContextHolder.getContext()
                    .getAuthentication().getName();
            Long userId = Long.parseLong(userIdStr);
            return ResponseEntity.ok(kpiService.getManagerTeam(userId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/positions/status")
    public ResponseEntity<List<com.epms.backend.dto.hr.PositionKpiStatusDto>> getPositionsKpiStatus(
            @RequestParam(required = false) Long departmentId,
            @RequestParam String period) {
        return ResponseEntity.ok(kpiService.getPositionsKpiStatus(departmentId, period));
    }

    @GetMapping("/departments/status")
    public ResponseEntity<List<com.epms.backend.dto.hr.DepartmentKpiStatusDto>> getDepartmentsKpiStatus(
            @RequestParam String period) {
        return ResponseEntity.ok(kpiService.getDepartmentsKpiStatus(period));
    }

    @GetMapping("/history/employee/{employeeId}")
    public ResponseEntity<List<KpiDto>> getEmployeeKpiHistory(
            @PathVariable Long employeeId,
            @RequestParam(required = false) String period) {
        return ResponseEntity.ok(kpiService.getEmployeeKpiHistory(employeeId, period));
    }

    @GetMapping("/history/position")
    public ResponseEntity<List<PositionKpiDto>> getPositionKpiHistory(
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long positionId,
            @RequestParam(required = false) String period) {
        return ResponseEntity.ok(kpiService.getPositionKpiHistory(departmentId, positionId, period));
    }

    @GetMapping("/history/department")
    public ResponseEntity<List<DepartmentKpiDto>> getDepartmentKpiHistory(
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String period) {
        return ResponseEntity.ok(kpiService.getDepartmentKpiHistory(departmentId, period));
    }

    @GetMapping("/history/summary")
    public ResponseEntity<List<com.epms.backend.dto.KpiHistorySummaryDto>> getAllHistorySummary(
            @RequestParam(required = false) String period) {
        return ResponseEntity.ok(kpiService.getAllKpiHistorySummary(period));
    }

    @GetMapping("/history/department-comparison")
    public ResponseEntity<List<com.epms.backend.dto.DepartmentComparisonDto>> getDepartmentComparison(
            @RequestParam(required = false) String period) {
        return ResponseEntity.ok(kpiService.getDepartmentComparison(period));
    }

    @PreAuthorize("hasRole('HR')")
    @PostMapping("/hr/reset-monthly")
    public ResponseEntity<Void> performMonthlyReset() {
        try {
            String userIdStr = org.springframework.security.core.context.SecurityContextHolder.getContext()
                    .getAuthentication().getName();
            Long userId = Long.parseLong(userIdStr);
            kpiService.performMonthlyReset(userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
