package com.epms.backend.controller;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.SelfAssessment;
import com.epms.backend.entity.User;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.service.SelfAssessmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/self-assessments")
@RequiredArgsConstructor
public class SelfAssessmentController {

    private final SelfAssessmentService selfAssessmentService;
    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<SelfAssessment>> getMyLatest(Authentication authentication) {
        Employee employee = getEmployee(authentication);
        SelfAssessment sa = selfAssessmentService.getLatestSelfAssessment(employee);
        return ResponseEntity.ok(ApiResponse.ok("Latest self assessment fetched", sa));
    }

    @GetMapping("/my-history")
    public ResponseEntity<ApiResponse<List<SelfAssessment>>> getMyHistory(Authentication authentication) {
        Employee employee = getEmployee(authentication);
        List<SelfAssessment> history = selfAssessmentService.getEmployeeSelfAssessments(employee);
        return ResponseEntity.ok(ApiResponse.ok("Self assessment history fetched", history));
    }

    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<SelfAssessment>> submit(Authentication authentication, @RequestBody SelfAssessment sa) {
        Employee employee = getEmployee(authentication);
        sa.setEmployee(employee);
        SelfAssessment saved = selfAssessmentService.submitSelfAssessment(sa);
        return ResponseEntity.ok(ApiResponse.ok("Self assessment submitted successfully", saved));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<SelfAssessment>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok("All self assessments fetched", selfAssessmentService.getAllSelfAssessments()));
    }

    @PostMapping("/{id}/manager-review")
    public ResponseEntity<ApiResponse<SelfAssessment>> managerReview(@PathVariable Long id, @RequestBody ReviewRequest req) {
        SelfAssessment sa = selfAssessmentService.managerReview(id, req.getComments(), req.getSignature());
        return ResponseEntity.ok(ApiResponse.ok("Manager review submitted", sa));
    }

    @PostMapping("/{id}/hr-review")
    public ResponseEntity<ApiResponse<SelfAssessment>> hrReview(@PathVariable Long id, @RequestBody ReviewRequest req) {
        SelfAssessment sa = selfAssessmentService.hrReview(id, req.getComments(), req.getSignature());
        return ResponseEntity.ok(ApiResponse.ok("HR review submitted", sa));
    }

    private Employee getEmployee(Authentication authentication) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getEmployee();
    }

    @lombok.Data
    public static class ReviewRequest {
        private String comments;
        private String signature;
    }
}
