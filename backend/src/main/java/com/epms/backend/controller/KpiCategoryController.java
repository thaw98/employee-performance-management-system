package com.epms.backend.controller;

import com.epms.backend.entity.KpiCategory;
import com.epms.backend.repository.KpiCategoryRepository;
import com.epms.backend.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.PostConstruct;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/kpi-categories")
public class KpiCategoryController {

    private final KpiCategoryRepository kpiCategoryRepository;

    public KpiCategoryController(KpiCategoryRepository kpiCategoryRepository) {
        this.kpiCategoryRepository = kpiCategoryRepository;
    }

    @PostConstruct
    public void init() {
        if (kpiCategoryRepository.count() == 0) {
            List<String> initialCategories = List.of(
                "Delivery Performance",
                "Financial Management",
                "Quality Assurance",
                "Stakeholder Satisfaction",
                "Team Performance",
                "Compliance Management"
            );
            for (String name : initialCategories) {
                KpiCategory cat = new KpiCategory();
                cat.setName(name);
                cat.setStatus("Active");
                kpiCategoryRepository.save(cat);
            }
        }
    }

    @GetMapping
    public ResponseEntity<List<KpiCategory>> getAllCategories() {
        return ResponseEntity.ok(kpiCategoryRepository.findByStatusIgnoreCase("Active"));
    }

    @PostMapping
    public ResponseEntity<?> addCategory(@RequestBody KpiCategory category, @AuthenticationPrincipal UserPrincipal principal) {
        if (kpiCategoryRepository.existsByNameIgnoreCase(category.getName())) {
            return ResponseEntity.badRequest().body("Category already exists");
        }
        category.setCreatedBy(principal.getId());
        category.setCreatedOn(Instant.now());
        category.setStatus("Active");
        return ResponseEntity.ok(kpiCategoryRepository.save(category));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        kpiCategoryRepository.findById(id).ifPresent(cat -> {
            cat.setStatus("Inactive");
            kpiCategoryRepository.save(cat);
        });
        return ResponseEntity.ok().build();
    }
}
