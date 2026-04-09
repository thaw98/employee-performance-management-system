package com.epms.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import com.epms.backend.service.KpiService;
import com.epms.backend.service.KpiExcelService;
import com.epms.backend.entity.KpiRecord;
import com.epms.backend.entity.KpiRevision;
import com.epms.backend.entity.Employee;
import com.epms.backend.dto.KpiUpdateDTO;
import com.epms.backend.service.EmployeeService;

import java.util.List;

//MNA
@RestController
@RequestMapping("/api/v1/kpis")
public class KpiController {

    private final KpiService kpiService;
    private final EmployeeService employeeService;
    private final KpiExcelService kpiExcelService;

    public KpiController(KpiService kpiService, EmployeeService employeeService, KpiExcelService kpiExcelService) {
        this.kpiService = kpiService;
        this.employeeService = employeeService;
        this.kpiExcelService = kpiExcelService;
    }

    @GetMapping("/employee/{id}")
    public ResponseEntity<List<KpiRecord>> getEmployeeKpis(@PathVariable Long id, @RequestParam Long periodId) {
        return ResponseEntity.ok(kpiService.getKpisByEmployee(id, periodId));
    }

    /**
     * FR-KPI-07: Save Draft or Finalize Submission
     */
    @PostMapping("/batch")
    public ResponseEntity<List<KpiRecord>> saveBatch(
            @RequestBody List<KpiRecord> records,
            @RequestParam(defaultValue = "false") boolean isFinal,
            @RequestHeader("X-User-Id") Long currentUserId) {
        Employee currentUser = employeeService.getEmployeeById(currentUserId);
        return ResponseEntity.ok(kpiService.saveKpiBatch(records, isFinal, currentUser.getEmployeeName()));
    }

    @PutMapping("/{id}/actuals")
    public ResponseEntity<KpiRecord> updateActuals(
            @PathVariable Long id,
            @RequestBody KpiUpdateDTO dto,
            @RequestHeader("X-User-Id") Long currentUserId,
            @RequestHeader("X-User-Role") String role) {

        Employee currentUser = employeeService.getEmployeeById(currentUserId);
        boolean isHr = "HR".equalsIgnoreCase(role) || "ADMIN".equalsIgnoreCase(role);
        return ResponseEntity.ok(kpiService.updateActualValue(id, dto, currentUser, isHr));
    }

    @PutMapping("/{id}/revise")
    public ResponseEntity<KpiRecord> reviseKpi(
            @PathVariable Long id,
            @RequestBody KpiRecord revisedData,
            @RequestHeader("X-User-Id") Long currentUserId) {
        Employee currentUser = employeeService.getEmployeeById(currentUserId);
        return ResponseEntity.ok(kpiService.reviseKpi(id, revisedData, currentUserId, currentUser.getEmployeeName()));
    }

    /**
     * HR Only: Approve and Move to finalized scoring
     */
    @PostMapping("/approve")
    public ResponseEntity<Void> approveKpis(
            @RequestParam Long employeeId,
            @RequestParam Long periodId,
            @RequestHeader("X-User-Id") Long currentUserId) {
        Employee currentUser = employeeService.getEmployeeById(currentUserId);
        kpiService.approveKpiBatch(employeeId, periodId, currentUser.getEmployeeName());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/lock")
    public ResponseEntity<Void> lockKpis(
            @RequestParam Long employeeId,
            @RequestParam Long periodId,
            @RequestHeader("X-User-Id") Long currentUserId) {
        Employee currentUser = employeeService.getEmployeeById(currentUserId);
        kpiService.lockKpiBatch(employeeId, periodId, currentUser.getEmployeeName());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<KpiRevision>> getRevisionHistory(@PathVariable Long id) {
        return ResponseEntity.ok(kpiService.getRevisionHistory(id));
    }

    /**
     * KM-17: Download Excel Template
     */
    @GetMapping("/excel/template")
    public ResponseEntity<Resource> downloadTemplate() {
        InputStreamResource file = new InputStreamResource(kpiExcelService.generateTemplate());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=kpi_import_template.xlsx")
                .contentType(
                        MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(file);
    }

    /**
     * KM-18: Export KPI Data
     */
    @GetMapping("/excel/export")
    public ResponseEntity<Resource> exportKpis(@RequestParam Long employeeId, @RequestParam Long periodId) {
        List<KpiRecord> records = kpiService.getKpisByEmployee(employeeId, periodId);
        InputStreamResource file = new InputStreamResource(kpiExcelService.exportKpis(records));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=kpi_export.xlsx")
                .contentType(
                        MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(file);
    }

    /**
     * KM-16: Import KPI Data
     */
    @PostMapping("/excel/import")
    public ResponseEntity<List<KpiRecord>> importKpis(
            @RequestParam("file") MultipartFile file,
            @RequestHeader("X-User-Id") Long currentUserId) {
        Employee currentUser = employeeService.getEmployeeById(currentUserId);
        return ResponseEntity.ok(kpiExcelService.importKpiData(file, currentUser.getEmployeeName()));
    }
}
