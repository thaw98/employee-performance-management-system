package com.epms.backend.controller;

import com.epms.backend.entity.KpiName;
import com.epms.backend.repository.KpiNameRepository;
import com.epms.backend.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/kpi-names")
public class KpiNameController {

    private final KpiNameRepository kpiNameRepository;

    public KpiNameController(KpiNameRepository kpiNameRepository) {
        this.kpiNameRepository = kpiNameRepository;
    }

    @GetMapping
    public ResponseEntity<List<KpiName>> getAllNames() {
        return ResponseEntity.ok(kpiNameRepository.findByStatusIgnoreCase("Active"));
    }

    @PostMapping
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<?> addName(@RequestBody KpiName kpiName, @AuthenticationPrincipal UserPrincipal principal) {
        String name = normalizeRequiredName(kpiName.getName());
        if (name == null) {
            return ResponseEntity.badRequest().body("KPI name is required");
        }
        if (kpiNameRepository.existsByNameIgnoreCase(name)) {
            return ResponseEntity.badRequest().body("KPI name already exists");
        }

        kpiName.setName(name);
        kpiName.setDescription(normalizeOptional(kpiName.getDescription()));
        kpiName.setCreatedBy(principal.getId());
        kpiName.setCreatedOn(Instant.now());
        kpiName.setStatus("Active");
        return ResponseEntity.ok(kpiNameRepository.save(kpiName));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<?> deleteName(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        kpiNameRepository.findById(id).ifPresent(kpiName -> {
            kpiName.setStatus("Inactive");
            kpiName.setUpdatedBy(principal.getId());
            kpiName.setUpdatedOn(Instant.now());
            kpiNameRepository.save(kpiName);
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
