package com.epms.backend.controller;

import com.epms.backend.dto.KpiDto;
import com.epms.backend.service.KpiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    @PostMapping("/setup")
    public ResponseEntity<List<KpiDto>> setupKpis(@RequestBody List<KpiDto> kpiDtos) {
        try {
            return ResponseEntity.ok(kpiService.saveKpis(kpiDtos));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}
