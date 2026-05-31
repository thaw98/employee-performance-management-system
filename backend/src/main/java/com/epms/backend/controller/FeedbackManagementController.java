package com.epms.backend.controller;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.feedbackmanagement.FeedbackLimitConfigDto;
import com.epms.backend.dto.feedbackmanagement.FeedbackTemplateConfigDto;
import com.epms.backend.service.FeedbackManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/feedback-management")
@RequiredArgsConstructor
@PreAuthorize("hasRole('HR')")
public class FeedbackManagementController {
    private final FeedbackManagementService service;

    @GetMapping("/templates")
    public ResponseEntity<ApiResponse<List<FeedbackTemplateConfigDto>>> getTemplates(@RequestParam(required = false) Long reviewCycleId) {
        return ResponseEntity.ok(ApiResponse.ok("Feedback templates retrieved successfully", service.getTemplates(reviewCycleId)));
    }

    @PostMapping("/templates")
    public ResponseEntity<ApiResponse<FeedbackTemplateConfigDto>> createTemplate(@RequestBody FeedbackTemplateConfigDto request) {
        return ResponseEntity.ok(ApiResponse.ok("Feedback template created successfully", service.saveTemplate(null, request)));
    }

    @PutMapping("/templates/{id}")
    public ResponseEntity<ApiResponse<FeedbackTemplateConfigDto>> updateTemplate(@PathVariable Long id, @RequestBody FeedbackTemplateConfigDto request) {
        return ResponseEntity.ok(ApiResponse.ok("Feedback template updated successfully", service.saveTemplate(id, request)));
    }

    @DeleteMapping("/templates/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTemplate(@PathVariable Long id) {
        service.deleteTemplate(id);
        return ResponseEntity.ok(ApiResponse.ok("Feedback template deleted successfully", null));
    }

    @GetMapping("/limits")
    public ResponseEntity<ApiResponse<List<FeedbackLimitConfigDto>>> getLimits(@RequestParam(required = false) Long reviewCycleId) {
        return ResponseEntity.ok(ApiResponse.ok("Feedback limits retrieved successfully", service.getLimits(reviewCycleId)));
    }

    @PostMapping("/limits")
    public ResponseEntity<ApiResponse<FeedbackLimitConfigDto>> createLimit(@RequestBody FeedbackLimitConfigDto request) {
        return ResponseEntity.ok(ApiResponse.ok("Feedback limit created successfully", service.saveLimit(null, request)));
    }

    @PutMapping("/limits/{id}")
    public ResponseEntity<ApiResponse<FeedbackLimitConfigDto>> updateLimit(@PathVariable Long id, @RequestBody FeedbackLimitConfigDto request) {
        return ResponseEntity.ok(ApiResponse.ok("Feedback limit updated successfully", service.saveLimit(id, request)));
    }

    @DeleteMapping("/limits/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteLimit(@PathVariable Long id) {
        service.deleteLimit(id);
        return ResponseEntity.ok(ApiResponse.ok("Feedback limit deleted successfully", null));
    }
}
