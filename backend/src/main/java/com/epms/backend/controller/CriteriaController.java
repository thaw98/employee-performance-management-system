package com.epms.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.CriteriaDto;
import com.epms.backend.service.CriteriaService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/criteria")
@RequiredArgsConstructor
public class CriteriaController {

    private final CriteriaService criteriaService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CriteriaDto>>> getAllCriteria() {
        return ResponseEntity.ok(ApiResponse.ok("Criteria fetched successfully", criteriaService.getAllCriteria()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('HR')")
    public ResponseEntity<ApiResponse<CriteriaDto>> createCriteria(@RequestBody CriteriaDto dto) {
        return ResponseEntity.ok(ApiResponse.ok("Criteria created successfully", criteriaService.createCriteria(dto)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR')")
    public ResponseEntity<ApiResponse<CriteriaDto>> updateCriteria(@PathVariable Long id, @RequestBody CriteriaDto dto) {
        return ResponseEntity.ok(ApiResponse.ok("Criteria updated successfully", criteriaService.updateCriteria(id, dto)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR')")
    public ResponseEntity<ApiResponse<Void>> deleteCriteria(@PathVariable Long id) {
        criteriaService.deleteCriteria(id);
        return ResponseEntity.ok(ApiResponse.ok("Criteria deleted successfully", null));
    }
}
