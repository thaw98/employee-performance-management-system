package com.epms.backend.controller;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.entity.AppraisalAssignment;
import com.epms.backend.security.UserPrincipal;
import com.epms.backend.service.AppraisalAssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/appraisal-assignments")
@RequiredArgsConstructor
@org.springframework.security.access.prepost.PreAuthorize("hasRole('HR')")
public class AppraisalAssignmentController {

    private final AppraisalAssignmentService appraisalAssignmentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AppraisalAssignment>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok("Fetched all assignments", appraisalAssignmentService.getAllAssignments()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AppraisalAssignment>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Fetched assignment", appraisalAssignmentService.getById(id)));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<AppraisalAssignment>> approve(@PathVariable Long id, 
                                                                  @RequestBody ActionRequest req,
                                                                  Authentication auth) {
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        AppraisalAssignment saved = appraisalAssignmentService.approve(id, req.getComments(), req.getSignature(), principal.getId(), principal.getRoleId());
        return ResponseEntity.ok(ApiResponse.ok("Appraisal approved", saved));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<AppraisalAssignment>> reject(@PathVariable Long id, 
                                                                 @RequestBody ActionRequest req,
                                                                 Authentication auth) {
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        AppraisalAssignment saved = appraisalAssignmentService.reject(id, req.getComments(), principal.getId(), principal.getRoleId());
        return ResponseEntity.ok(ApiResponse.ok("Appraisal rejected", saved));
    }

    @PostMapping("/{id}/return")
    public ResponseEntity<ApiResponse<AppraisalAssignment>> returnForRevision(@PathVariable Long id, 
                                                                            @RequestBody ActionRequest req,
                                                                            Authentication auth) {
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        AppraisalAssignment saved = appraisalAssignmentService.returnForRevision(id, req.getComments(), principal.getId(), principal.getRoleId());
        return ResponseEntity.ok(ApiResponse.ok("Appraisal returned for revision", saved));
    }

    @PostMapping("/{id}/lock")
    public ResponseEntity<ApiResponse<AppraisalAssignment>> lock(@PathVariable Long id, Authentication auth) {
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        AppraisalAssignment saved = appraisalAssignmentService.lock(id, principal.getId(), principal.getRoleId());
        return ResponseEntity.ok(ApiResponse.ok("Appraisal locked", saved));
    }

    @PostMapping("/{id}/unlock")
    public ResponseEntity<ApiResponse<AppraisalAssignment>> unlock(@PathVariable Long id, 
                                                                 @RequestBody ActionRequest req,
                                                                 Authentication auth) {
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        AppraisalAssignment saved = appraisalAssignmentService.unlock(id, req.getComments(), principal.getId(), principal.getRoleId());
        return ResponseEntity.ok(ApiResponse.ok("Appraisal unlocked", saved));
    }

    @lombok.Data
    public static class ActionRequest {
        private String comments;
        private String signature;
    }
}
