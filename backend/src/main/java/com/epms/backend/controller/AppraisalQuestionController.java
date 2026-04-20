package com.epms.backend.controller;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.AppraisalQuestionDto;
import com.epms.backend.service.AppraisalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appraisal-questions")
@RequiredArgsConstructor
public class AppraisalQuestionController {

    private final AppraisalService appraisalService;

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<ApiResponse<List<AppraisalQuestionDto>>> getQuestionsByCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(ApiResponse.ok("Questions fetched successfully", appraisalService.getQuestionsByCategory(categoryId)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('HR')")
    public ResponseEntity<ApiResponse<AppraisalQuestionDto>> createQuestion(@RequestBody AppraisalQuestionDto dto) {
        return ResponseEntity.ok(ApiResponse.ok("Question created successfully", appraisalService.createQuestion(dto)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR')")
    public ResponseEntity<ApiResponse<AppraisalQuestionDto>> updateQuestion(@PathVariable Long id, @RequestBody AppraisalQuestionDto dto) {
        return ResponseEntity.ok(ApiResponse.ok("Question updated successfully", appraisalService.updateQuestion(id, dto)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR')")
    public ResponseEntity<ApiResponse<Void>> deleteQuestion(@PathVariable Long id) {
        appraisalService.deleteQuestion(id);
        return ResponseEntity.ok(ApiResponse.ok("Question deleted successfully", null));
    }
}
