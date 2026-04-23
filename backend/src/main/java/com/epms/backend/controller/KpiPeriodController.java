package com.epms.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.epms.backend.entity.AppraisalCycle;
import com.epms.backend.repository.KpiPeriodRepository;
import java.util.List;

//MNA
@RestController
@RequestMapping("/api/v1/kpi-periods")
public class KpiPeriodController {

    private final KpiPeriodRepository kpiPeriodRepository;

    public KpiPeriodController(KpiPeriodRepository kpiPeriodRepository) {
        this.kpiPeriodRepository = kpiPeriodRepository;
    }

    @PostMapping
    public ResponseEntity<?> createPeriod(@RequestBody AppraisalCycle period) {
        // Validation: end < start
        if (period.getEndDate() != null && period.getStartDate() != null) {
            if (period.getEndDate().isBefore(period.getStartDate())) {
                return ResponseEntity.badRequest().body("Validation Error: End date cannot be before start date.");
            }
        }

        // Handle logic for "Annual" or "Budget Year" naming/activation if needed
        if (period.getIsActive() != null && period.getIsActive()) {
            // Optional: de-activate other periods of same type?
        }

        return ResponseEntity.ok(kpiPeriodRepository.save(period));
    }

    @GetMapping
    public ResponseEntity<List<AppraisalCycle>> getAllPeriods() {
        return ResponseEntity.ok(kpiPeriodRepository.findAll());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePeriod(@PathVariable Long id) {
        kpiPeriodRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
