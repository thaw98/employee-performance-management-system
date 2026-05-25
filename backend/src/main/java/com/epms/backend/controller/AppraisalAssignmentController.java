package com.epms.backend.controller;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.appraisal.AppraisalHistorySummaryRowDto;
import com.epms.backend.entity.AppraisalAssignment;
import com.epms.backend.security.UserPrincipal;
import com.epms.backend.service.AppraisalAssignmentService;
import com.epms.backend.service.AppraisalHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/appraisal-assignments")
@RequiredArgsConstructor
@org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('HR', 'MANAGER', 'DEPARTMENT_HEAD', 'TEAM_HEAD', 'EMPLOYEE')")
public class AppraisalAssignmentController {

    private final AppraisalAssignmentService appraisalAssignmentService;
    private final AppraisalHistoryService appraisalHistoryService;

    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('HR')")
    public ResponseEntity<ApiResponse<List<AppraisalAssignment>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok("Fetched all assignments", appraisalAssignmentService.getAllAssignments()));
    }

    @GetMapping("/my-assignments")
    public ResponseEntity<ApiResponse<List<AppraisalAssignment>>> getMyAssignments(Authentication auth) {
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok("Fetched my assignments", appraisalAssignmentService.getAssignmentsForEmployee(principal.getEmployeeDbId())));
    }

    @GetMapping("/my-team")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MANAGER', 'DEPARTMENT_HEAD', 'TEAM_HEAD')")
    public ResponseEntity<ApiResponse<List<AppraisalAssignment>>> getMyTeamAssignments(Authentication auth) {
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        System.out.println("DEBUG: Fetching team assignments for evaluator ID: " + principal.getEmployeeDbId() + " (User: " + principal.getName() + ")");
        List<AppraisalAssignment> assignments = appraisalAssignmentService.getAssignmentsForEvaluator(principal.getEmployeeDbId());
        System.out.println("DEBUG: Found " + assignments.size() + " assignments.");
        return ResponseEntity.ok(ApiResponse.ok("Fetched team assignments", assignments));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<AppraisalHistorySummaryRowDto>>> getHistory(Authentication auth) {
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        List<AppraisalHistorySummaryRowDto> rows = appraisalHistoryService.getHistory(
                principal.getEmployeeDbId(),
                principal.getRoleId());
        return ResponseEntity.ok(ApiResponse.ok("Fetched appraisal history", rows));
    }

    @GetMapping("/history/export/excel")
    public ResponseEntity<byte[]> exportHistoryExcel(@RequestParam Long cycleId, Authentication auth) {
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        byte[] workbook = appraisalHistoryService.exportCycleWorkbook(
                cycleId,
                principal.getEmployeeDbId(),
                principal.getRoleId());
        String filename = appraisalHistoryService.buildExportFilename(cycleId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(workbook);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AppraisalAssignment>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Fetched assignment", appraisalAssignmentService.getById(id)));
    }

    @PostMapping("/{id}/evaluate")
    public ResponseEntity<ApiResponse<AppraisalAssignment>> submitEvaluation(@PathVariable Long id, 
                                                                           @RequestBody com.epms.backend.dto.EvaluationRequest req,
                                                                           Authentication auth) {
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        AppraisalAssignment saved = appraisalAssignmentService.submitEvaluation(id, req, principal.getId(), principal.getRoleId());
        return ResponseEntity.ok(ApiResponse.ok("Appraisal evaluation submitted", saved));
    }

    @PostMapping("/{id}/draft")
    public ResponseEntity<ApiResponse<AppraisalAssignment>> saveDraft(@PathVariable Long id,
                                                                      @RequestBody com.epms.backend.dto.EvaluationRequest req) {
        AppraisalAssignment saved = appraisalAssignmentService.saveDraft(id, req);
        return ResponseEntity.ok(ApiResponse.ok("Appraisal evaluation draft saved", saved));
    }

    @GetMapping("/{id}/form")
    public ResponseEntity<ApiResponse<AppraisalAssignment>> getEvaluationForm(@PathVariable Long id) {
        AppraisalAssignment assignment = appraisalAssignmentService.getById(id);
        if (assignment == null) {
            return ResponseEntity.status(404).body(ApiResponse.fail("Appraisal assignment not found"));
        }
        // Ensure template and questions are initialized if needed
        if (assignment.getTemplate() != null && assignment.getTemplate().getCategories() != null) {
            assignment.getTemplate().getCategories().forEach(c -> {
                if (c.getQuestions() != null) {
                    c.getQuestions().size();
                }
            });
        }
        return ResponseEntity.ok(ApiResponse.ok("Fetched evaluation form", assignment));
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

    @PostMapping("/{id}/reset")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('HR')")
    public ResponseEntity<ApiResponse<AppraisalAssignment>> reset(@PathVariable Long id, Authentication auth) {
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        AppraisalAssignment saved = appraisalAssignmentService.reset(id, principal.getId(), principal.getRoleId());
        return ResponseEntity.ok(ApiResponse.ok("Appraisal reset to pending manager", saved));
    }

    @lombok.Data
    public static class ActionRequest {
        private String comments;
        private String signature;
    }
}
