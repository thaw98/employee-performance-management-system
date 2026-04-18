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
        try {
            Employee employee = getEmployee(authentication);
            if (employee == null) {
                return ResponseEntity.ok(ApiResponse.ok("No employee profile found", null));
            }
            SelfAssessment sa = selfAssessmentService.getLatestSelfAssessment(employee);
            return ResponseEntity.ok(ApiResponse.ok("Latest self assessment fetched", sa));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(ApiResponse.fail("Internal Error in getMyLatest: " + e.getMessage()));
        }
    }

    @GetMapping("/my-history")
    public ResponseEntity<ApiResponse<List<SelfAssessment>>> getMyHistory(Authentication authentication) {
        Employee employee = getEmployee(authentication);
        List<SelfAssessment> history = selfAssessmentService.getEmployeeSelfAssessments(employee);
        return ResponseEntity.ok(ApiResponse.ok("Self assessment history fetched", history));
    }

    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<SelfAssessment>> submit(Authentication authentication,
            @RequestBody SelfAssessment sa) {
        Employee employee = getEmployee(authentication);
        if (employee == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.fail("You do not have an employee profile. Please contact HR."));
        }
        sa.setEmployee(employee);
        SelfAssessment saved = selfAssessmentService.submitSelfAssessment(sa);
        return ResponseEntity.ok(ApiResponse.ok("Self assessment submitted successfully", saved));
    }

    @GetMapping("/all")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('HR') or hasRole('DEPARTMENT_HEAD') or hasRole('TEAM_HEAD')")
    public ResponseEntity<ApiResponse<List<SelfAssessment>>> getAll() {
        try {
            List<SelfAssessment> list = selfAssessmentService.getAllSelfAssessments();
            System.out.println("DEBUG: Returning " + list.size() + " assessments");
            return ResponseEntity
                    .ok(ApiResponse.ok("All self assessments fetched", list));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(ApiResponse.fail("Internal Error in getAll: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/manager-review")
    public ResponseEntity<ApiResponse<SelfAssessment>> managerReview(@PathVariable Long id,
            @RequestBody ReviewRequest req) {
        SelfAssessment sa = selfAssessmentService.managerReview(id, req.getComments(), req.getSignature());
        return ResponseEntity.ok(ApiResponse.ok("Manager review submitted", sa));
    }

    @PostMapping("/create/all")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('HR')")
    public ResponseEntity<ApiResponse<Void>> createAll() {
        selfAssessmentService.createForAllEmployees();
        return ResponseEntity.ok(ApiResponse.ok("Self assignments created for all employees", null));
    }

    @PostMapping("/create/{employeeId}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('HR')")
    public ResponseEntity<ApiResponse<SelfAssessment>> create(@PathVariable Long employeeId) {
        Employee employee = new Employee();
        employee.setId(employeeId);
        SelfAssessment saved = selfAssessmentService.createAssignment(employee);
        return ResponseEntity.ok(ApiResponse.ok("Self assignment created successfully", saved));
    }

    @PostMapping("/{id}/unlock")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('HR')")
    public ResponseEntity<ApiResponse<SelfAssessment>> unlock(@PathVariable Long id) {
        SelfAssessment sa = selfAssessmentService.unlock(id);
        return ResponseEntity.ok(ApiResponse.ok("Self assignment unlocked successfully", sa));
    }

    @PostMapping("/{id}/hr-review")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('HR')")
    public ResponseEntity<ApiResponse<SelfAssessment>> hrReview(@PathVariable Long id, @RequestBody ReviewRequest req) {
        SelfAssessment sa = selfAssessmentService.hrReview(id, req.getComments(), req.getSignature());
        return ResponseEntity.ok(ApiResponse.ok("Self assignment finalized", sa));
    }

    @PostMapping("/{id}/request-correction")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('HR') or hasRole('DEPARTMENT_HEAD')")
    public ResponseEntity<ApiResponse<SelfAssessment>> requestCorrection(@PathVariable Long id, @RequestBody CorrectionRequest req) {
        SelfAssessment sa = selfAssessmentService.requestCorrection(id, req.getRemarks());
        return ResponseEntity.ok(ApiResponse.ok("Correction requested", sa));
    }

    @lombok.Data
    public static class CorrectionRequest {
        private String remarks;
    }

    private Employee getEmployee(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            System.err.println("DEBUG: Authentication or principal is null");
            return null;
        }
        
        if (!(authentication.getPrincipal() instanceof com.epms.backend.security.UserPrincipal)) {
            System.err.println("DEBUG: Principal is not UserPrincipal: " + authentication.getPrincipal().getClass().getName());
            return null;
        }

        com.epms.backend.security.UserPrincipal principal = (com.epms.backend.security.UserPrincipal) authentication
                .getPrincipal();
        User user = userRepository.findById(principal.getId())
                .orElse(null);
        
        if (user == null) {
            System.err.println("DEBUG: User not found for ID: " + principal.getId());
            return null;
        }
        
        return user.getEmployee();
    }

    @lombok.Data
    public static class ReviewRequest {
        private String comments;
        private String signature;
    }
}
