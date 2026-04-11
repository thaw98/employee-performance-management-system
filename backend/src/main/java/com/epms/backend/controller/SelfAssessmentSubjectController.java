package com.epms.backend.controller;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.entity.SelfAssessmentSubject;
import com.epms.backend.repository.SelfAssessmentSubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/self-assessment-subjects")
@RequiredArgsConstructor
public class SelfAssessmentSubjectController {

    private final SelfAssessmentSubjectRepository repository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SelfAssessmentSubject>>> getAllActive() {
        return ResponseEntity.ok(ApiResponse.ok("Subjects fetched", 
            repository.findAllByIsActiveOrderByDisplayOrderAsc(true)));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<ApiResponse<List<SelfAssessmentSubject>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok("All subjects fetched", repository.findAll()));
    }

    @PostMapping
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<ApiResponse<SelfAssessmentSubject>> create(@RequestBody SelfAssessmentSubject subject) {
        return ResponseEntity.ok(ApiResponse.ok("Subject created", repository.save(subject)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<ApiResponse<SelfAssessmentSubject>> update(@PathVariable Long id, @RequestBody SelfAssessmentSubject updated) {
        SelfAssessmentSubject existing = repository.findById(id).orElseThrow();
        existing.setSubjectText(updated.getSubjectText());
        existing.setDisplayOrder(updated.getDisplayOrder());
        existing.setIsActive(updated.getIsActive());
        return ResponseEntity.ok(ApiResponse.ok("Subject updated", repository.save(existing)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Subject deleted", null));
    }
}
