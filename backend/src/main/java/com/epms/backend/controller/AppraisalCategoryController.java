package com.epms.backend.controller;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.AppraisalCategoryDto;
import com.epms.backend.dto.AppraisalTemplateDto;
import com.epms.backend.service.AppraisalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appraisal-categories")
@RequiredArgsConstructor
public class AppraisalCategoryController {

    private final AppraisalService appraisalService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AppraisalCategoryDto>>> getAllCategories() {
        return ResponseEntity.ok(ApiResponse.ok("Categories fetched successfully", appraisalService.getAllCategories()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('HR')")
    public ResponseEntity<ApiResponse<AppraisalCategoryDto>> createCategory(@RequestBody AppraisalCategoryDto dto) {
        return ResponseEntity.ok(ApiResponse.ok("Category created successfully", appraisalService.createCategory(dto)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR')")
    public ResponseEntity<ApiResponse<AppraisalCategoryDto>> updateCategory(@PathVariable Long id, @RequestBody AppraisalCategoryDto dto) {
        return ResponseEntity.ok(ApiResponse.ok("Category updated successfully", appraisalService.updateCategory(id, dto)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR')")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        appraisalService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.ok("Category deleted successfully", null));
    }

    @PostMapping("/finalize")
    @PreAuthorize("hasAnyRole('HR')")
    public ResponseEntity<ApiResponse<Void>> finalizeAppraisal(@RequestBody AppraisalTemplateDto dto) {
        appraisalService.finalizeAppraisal(dto);
        return ResponseEntity.ok(ApiResponse.ok("Appraisal finalized and saved successfully", null));
    }

    @GetMapping("/current-template")
    public ResponseEntity<ApiResponse<AppraisalTemplateDto>> getCurrentTemplate() {
        return ResponseEntity.ok(ApiResponse.ok("Current template fetched successfully", appraisalService.getCurrentTemplate()));
    }

    @GetMapping("/templates")
    @PreAuthorize("hasAnyRole('HR')")
    public ResponseEntity<ApiResponse<List<AppraisalTemplateDto>>> getAllTemplates() {
        return ResponseEntity.ok(ApiResponse.ok("All templates fetched successfully", appraisalService.getAllTemplates()));
    }

    @PostMapping("/distribute")
    @PreAuthorize("hasAnyRole('HR')")
    public ResponseEntity<ApiResponse<Void>> distributeToManagers() {
        appraisalService.distributeAppraisalsToManagers();
        return ResponseEntity.ok(ApiResponse.ok("Appraisals distributed to managers successfully", null));
    }
}
