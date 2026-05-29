package com.epms.backend.controller;

import com.epms.backend.entity.KpiUnit;
import com.epms.backend.repository.KpiUnitRepository;
import com.epms.backend.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.PostConstruct;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/kpi-units")
public class KpiUnitController {

    private final KpiUnitRepository kpiUnitRepository;

    public KpiUnitController(KpiUnitRepository kpiUnitRepository) {
        this.kpiUnitRepository = kpiUnitRepository;
    }

    @PostConstruct
    public void init() {
        if (kpiUnitRepository.count() == 0) {
            for (String name : List.of("Percentage", "Rating")) {
                KpiUnit unit = new KpiUnit();
                unit.setName(name);
                unit.setStatus("Active");
                kpiUnitRepository.save(unit);
            }
        }
    }

    @GetMapping
    public ResponseEntity<List<KpiUnit>> getAllUnits() {
        return ResponseEntity.ok(kpiUnitRepository.findByStatusIgnoreCase("Active"));
    }

    @PostMapping
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<?> addUnit(@RequestBody KpiUnit unit, @AuthenticationPrincipal UserPrincipal principal) {
        String name = normalizeRequiredName(unit.getName());
        if (name == null) {
            return ResponseEntity.badRequest().body("Unit name is required");
        }
        if (kpiUnitRepository.existsByNameIgnoreCase(name)) {
            return ResponseEntity.badRequest().body("Unit already exists");
        }

        unit.setName(name);
        unit.setDescription(normalizeOptional(unit.getDescription()));
        unit.setCreatedBy(principal.getId());
        unit.setCreatedOn(Instant.now());
        unit.setStatus("Active");
        return ResponseEntity.ok(kpiUnitRepository.save(unit));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<?> deleteUnit(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        kpiUnitRepository.findById(id).ifPresent(unit -> {
            unit.setStatus("Inactive");
            unit.setUpdatedBy(principal.getId());
            unit.setUpdatedOn(Instant.now());
            kpiUnitRepository.save(unit);
        });
        return ResponseEntity.ok().build();
    }

    private static String normalizeRequiredName(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private static String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
