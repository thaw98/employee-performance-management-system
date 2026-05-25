package com.epms.backend.controller;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.selfassessmentform.*;
import com.epms.backend.dto.selfassessmentform.ScoreRecordDto;
import com.epms.backend.dto.selfassessmentform.EmployeeDisputeRequest;
import com.epms.backend.dto.selfassessmentform.report.SelfAssessmentAnalyticsReportDto;
import com.epms.backend.entity.Employee;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.security.UserPrincipal;
import com.epms.backend.service.SelfAssessmentFormService;
import com.epms.backend.service.SelfAssessmentReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/self-assessment-forms")
@RequiredArgsConstructor
public class SelfAssessmentFormController {

    private final SelfAssessmentFormService selfAssessmentFormService;
    private final SelfAssessmentReportService selfAssessmentReportService;
    private final EmployeeRepository employeeRepository;

    @GetMapping("/me/status")
    public ResponseEntity<ApiResponse<FormStatusDto>> getMyFormStatus(@AuthenticationPrincipal UserPrincipal principal) {
        try {
            Employee employee = getEmployeeFromPrincipal(principal);
            FormStatusDto status = selfAssessmentFormService.getEmployeeFormStatus(employee);
            return ResponseEntity.ok(ApiResponse.ok("Form status retrieved", status));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @GetMapping("/me/current")
    public ResponseEntity<ApiResponse<SelfAssessmentFormDto>> getMyCurrentForm(@AuthenticationPrincipal UserPrincipal principal) {
        try {
            Employee employee = getEmployeeFromPrincipal(principal);
            SelfAssessmentFormDto form = selfAssessmentFormService.getEmployeeCurrentForm(employee)
                    .orElseThrow(() -> new RuntimeException("No form found"));
            return ResponseEntity.ok(ApiResponse.ok("Current form retrieved", form));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PostMapping("/me/draft")
    public ResponseEntity<ApiResponse<SelfAssessmentFormDto>> saveDraft(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SaveDraftRequest request) {
        try {
            Employee employee = getEmployeeFromPrincipal(principal);
            SelfAssessmentFormDto form = selfAssessmentFormService.saveDraft(employee, request);
            return ResponseEntity.ok(ApiResponse.ok("Draft saved successfully", form));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PostMapping("/me/submit")
    public ResponseEntity<ApiResponse<SelfAssessmentFormDto>> submitForm(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SubmitFormRequest request) {
        try {
            Employee employee = getEmployeeFromPrincipal(principal);
            SelfAssessmentFormDto form = selfAssessmentFormService.submitForm(employee, request);
            return ResponseEntity.ok(ApiResponse.ok("Form submitted successfully", form));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @GetMapping("/reviews")
    @PreAuthorize("principal.roleId == 1 or principal.roleId == 2 or principal.roleId == 4")
    public ResponseEntity<ApiResponse<List<FormListDto>>> getReviewForms(@AuthenticationPrincipal UserPrincipal principal) {
        try {
            Employee employee = getEmployeeFromPrincipal(principal);
            List<FormListDto> forms = selfAssessmentFormService.getManagerReviewForms(employee);
            return ResponseEntity.ok(ApiResponse.ok("Review forms retrieved", forms));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @GetMapping("/hr/review")
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<ApiResponse<List<FormListDto>>> getHrReviewForms(@AuthenticationPrincipal UserPrincipal principal) {
        try {
            List<FormListDto> forms = selfAssessmentFormService.getHrReviewForms();
            return ResponseEntity.ok(ApiResponse.ok("HR review forms retrieved", forms));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @GetMapping("/hr/all")
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<ApiResponse<List<FormListDto>>> getAllFormsForHr(@AuthenticationPrincipal UserPrincipal principal) {
        try {
            List<FormListDto> forms = selfAssessmentFormService.getAllFormsForHr();
            return ResponseEntity.ok(ApiResponse.ok("All forms retrieved", forms));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @GetMapping("/score-records")
    @PreAuthorize("principal.roleId == 1 or principal.roleId == 2 or principal.roleId == 3 or principal.roleId == 4")
    public ResponseEntity<ApiResponse<List<ScoreRecordDto>>> getScoreRecords(@AuthenticationPrincipal UserPrincipal principal) {
        try {
            Employee employee = getEmployeeFromPrincipal(principal);
            List<ScoreRecordDto> records = selfAssessmentFormService.getScoreRecords(employee, principal.getRoleId());
            return ResponseEntity.ok(ApiResponse.ok("Score records retrieved", records));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @GetMapping("/reports")
    @PreAuthorize("principal.roleId == 1 or principal.roleId == 2")
    public ResponseEntity<ApiResponse<SelfAssessmentAnalyticsReportDto>> getSelfAssessmentReport(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam Long cycleId) {
        try {
            Employee employee = getEmployeeFromPrincipal(principal);
            SelfAssessmentAnalyticsReportDto report = selfAssessmentReportService.getAnalyticsReportData(
                    employee,
                    principal.getRoleId(),
                    cycleId);
            return ResponseEntity.ok(ApiResponse.ok("Self-assessment report retrieved", report));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @GetMapping("/hr/active-cycle")
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<ApiResponse<ActiveCycleFormsDto>> getActiveCycleFormsForHr(@AuthenticationPrincipal UserPrincipal principal) {
        try {
            ActiveCycleFormsDto forms = selfAssessmentFormService.getActiveCycleFormsForHr();
            return ResponseEntity.ok(ApiResponse.ok("Active cycle forms retrieved", forms));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @GetMapping("/manager/active-cycle")
    @PreAuthorize("principal.roleId == 2 or principal.roleId == 4")
    public ResponseEntity<ApiResponse<ActiveCycleFormsDto>> getActiveCycleFormsForManager(@AuthenticationPrincipal UserPrincipal principal) {
        try {
            Employee manager = getEmployeeFromPrincipal(principal);
            ActiveCycleFormsDto forms = selfAssessmentFormService.getActiveCycleFormsForManager(manager);
            return ResponseEntity.ok(ApiResponse.ok("Active cycle forms retrieved", forms));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PostMapping("/hr/assignments")
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<ApiResponse<SelfAssessmentAssignmentResponse>> assignSelfAssessmentForms(
            @Valid @RequestBody SelfAssessmentAssignmentRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            SelfAssessmentAssignmentResponse response = selfAssessmentFormService.assignSelfAssessmentForms(request, principal.getId());
            return ResponseEntity.ok(ApiResponse.ok("Self-assessment forms assigned", response));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @GetMapping("/settings")
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<ApiResponse<SelfAssessmentSettingsDto>> getSettings() {
        try {
            return ResponseEntity.ok(ApiResponse.ok("Self-assessment settings retrieved", selfAssessmentFormService.getSettings()));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PutMapping("/settings")
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<ApiResponse<SelfAssessmentSettingsDto>> updateSettings(
            @Valid @RequestBody SelfAssessmentSettingsRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            SelfAssessmentSettingsDto settings = selfAssessmentFormService.updateSettings(request, principal.getId());
            return ResponseEntity.ok(ApiResponse.ok("Self-assessment settings saved", settings));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("principal.roleId == 1 or principal.roleId == 2 or principal.roleId == 3 or principal.roleId == 4")
    public ResponseEntity<ApiResponse<SelfAssessmentFormDto>> getFormById(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        try {
            Employee employee = getEmployeeFromPrincipal(principal);
            SelfAssessmentFormDto form = selfAssessmentFormService.getFormByIdForRole(id, employee, principal.getRoleId());
            return ResponseEntity.ok(ApiResponse.ok("Form retrieved", form));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PostMapping("/{id}/acknowledge")
    public ResponseEntity<ApiResponse<SelfAssessmentFormDto>> employeeAcknowledge(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            Employee employee = getEmployeeFromPrincipal(principal);
            SelfAssessmentFormDto form = selfAssessmentFormService.employeeAcknowledge(id, employee);
            return ResponseEntity.ok(ApiResponse.ok("Acknowledged successfully", form));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PostMapping("/{id}/dispute")
    public ResponseEntity<ApiResponse<SelfAssessmentFormDto>> employeeDispute(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeDisputeRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            Employee employee = getEmployeeFromPrincipal(principal);
            SelfAssessmentFormDto form = selfAssessmentFormService.employeeDispute(id, employee, request);
            return ResponseEntity.ok(ApiResponse.ok("Dispute submitted successfully", form));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PostMapping("/{id}/manager-review")
    @PreAuthorize("principal.roleId == 2 or principal.roleId == 4")
    public ResponseEntity<ApiResponse<SelfAssessmentFormDto>> managerReview(
            @PathVariable Long id,
            @Valid @RequestBody ManagerReviewRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            Employee manager = getEmployeeFromPrincipal(principal);
            SelfAssessmentFormDto form = selfAssessmentFormService.managerReview(id, manager, request);
            return ResponseEntity.ok(ApiResponse.ok("Manager review submitted", form));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PostMapping("/{id}/manager-request-retake")
    @PreAuthorize("principal.roleId == 2 or principal.roleId == 4")
    public ResponseEntity<ApiResponse<SelfAssessmentFormDto>> managerRequestRetake(
            @PathVariable Long id,
            @Valid @RequestBody ManagerRetakeRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            Employee manager = getEmployeeFromPrincipal(principal);
            SelfAssessmentFormDto form = selfAssessmentFormService.managerRequestRetake(id, manager, request);
            return ResponseEntity.ok(ApiResponse.ok("Retake requested", form));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PostMapping("/{id}/hr-request-retake")
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<ApiResponse<SelfAssessmentFormDto>> hrRequestRetake(
            @PathVariable Long id,
            @Valid @RequestBody ManagerRetakeRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            SelfAssessmentFormDto form = selfAssessmentFormService.hrRequestRetake(id, request, principal.getId());
            return ResponseEntity.ok(ApiResponse.ok("Retake requested", form));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @GetMapping("/score-records/export/pdf")
    @PreAuthorize("principal.roleId == 1 or principal.roleId == 2 or principal.roleId == 3 or principal.roleId == 4")
    public ResponseEntity<?> exportScoreRecordsPdf(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Long cycleId) {
        try {
            Employee employee = getEmployeeFromPrincipal(principal);
            byte[] bytes = selfAssessmentReportService.generateSummaryPdf(employee, principal.getRoleId(), cycleId);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(ContentDisposition.attachment()
                    .filename("self-assessment-summary-" + cycleId + ".pdf")
                    .build());
            return ResponseEntity.ok().headers(headers).body(bytes);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PostMapping("/{id}/retake-submit")
    public ResponseEntity<ApiResponse<SelfAssessmentFormDto>> employeeSubmitRetake(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeRetakeSubmitRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            Employee employee = getEmployeeFromPrincipal(principal);
            SelfAssessmentFormDto form = selfAssessmentFormService.employeeSubmitRetake(id, employee, request);
            return ResponseEntity.ok(ApiResponse.ok("Retake submitted", form));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PostMapping("/{id}/manager-approve-retake")
    @PreAuthorize("principal.roleId == 2 or principal.roleId == 4")
    public ResponseEntity<ApiResponse<SelfAssessmentFormDto>> managerApproveRetake(
            @PathVariable Long id,
            @RequestBody(required = false) ManagerApproveRetakeRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            Employee manager = getEmployeeFromPrincipal(principal);
            SelfAssessmentFormDto form = selfAssessmentFormService.managerApproveRetake(
                    id,
                    manager,
                    request == null ? new ManagerApproveRetakeRequest(null) : request);
            return ResponseEntity.ok(ApiResponse.ok("Retake approved", form));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PostMapping("/{id}/hr-approve-manager-review")
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<ApiResponse<SelfAssessmentFormDto>> hrApproveManagerReview(
            @PathVariable Long id,
            @Valid @RequestBody HrApproveManagerReviewRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            SelfAssessmentFormDto form = selfAssessmentFormService.hrApproveManagerReview(id, request, principal.getId());
            return ResponseEntity.ok(ApiResponse.ok("Manager review approved", form));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PostMapping("/{id}/hr-reject-manager-review")
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<ApiResponse<SelfAssessmentFormDto>> hrRejectManagerReview(
            @PathVariable Long id,
            @Valid @RequestBody HrRejectManagerReviewRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            SelfAssessmentFormDto form = selfAssessmentFormService.hrRejectManagerReview(id, request, principal.getId());
            return ResponseEntity.ok(ApiResponse.ok("Manager review rejected", form));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PostMapping("/{id}/hr-return-disputed-review")
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<ApiResponse<SelfAssessmentFormDto>> hrReturnDisputedReview(
            @PathVariable Long id,
            @Valid @RequestBody HrReturnDisputedReviewRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            SelfAssessmentFormDto form = selfAssessmentFormService.hrReturnDisputedReview(id, request, principal.getId());
            return ResponseEntity.ok(ApiResponse.ok("Disputed review returned to manager", form));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PostMapping("/{id}/hr-approve")
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<ApiResponse<SelfAssessmentFormDto>> hrApproveForm(
            @PathVariable Long id,
            @Valid @RequestBody HrApproveFormRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            SelfAssessmentFormDto form = selfAssessmentFormService.hrApproveForm(id, request, principal.getId());
            return ResponseEntity.ok(ApiResponse.ok("Form approved", form));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PostMapping("/{id}/reopen")
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<ApiResponse<SelfAssessmentFormDto>> hrReopenForm(
            @PathVariable Long id,
            @Valid @RequestBody HrReopenFormRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            SelfAssessmentFormDto form = selfAssessmentFormService.hrReopenForm(id, request, principal.getId());
            return ResponseEntity.ok(ApiResponse.ok("Form reopened", form));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @GetMapping("/templates")
    @PreAuthorize("principal.roleId == 1 or principal.roleId == 2")
    public ResponseEntity<ApiResponse<List<SelfAssessmentFormTemplateDto>>> getAllTemplates(@AuthenticationPrincipal UserPrincipal principal) {
        try {
            Employee employee = getEmployeeFromPrincipal(principal);
            List<SelfAssessmentFormTemplateDto> templates = selfAssessmentFormService.getAllTemplatesForRole(
                    principal.getId(), principal.getRoleId(), employee);
            return ResponseEntity.ok(ApiResponse.ok("Templates retrieved", templates));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PostMapping("/hr/assignments/preview")
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<ApiResponse<List<SelfAssessmentAssignmentPreviewDto>>> previewSelfAssessmentAssignments(
            @Valid @RequestBody SelfAssessmentAssignmentPreviewRequest request) {
        try {
            List<SelfAssessmentAssignmentPreviewDto> response = selfAssessmentFormService.previewSelfAssessmentAssignments(request);
            return ResponseEntity.ok(ApiResponse.ok("Self-assessment assignment preview retrieved", response));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PostMapping("/templates/{id}/copy")
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<ApiResponse<CopiedSelfAssessmentFormTemplateDto>> copyTemplate(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            CopiedSelfAssessmentFormTemplateDto copied = selfAssessmentFormService.copyTemplate(id, principal.getId());
            return ResponseEntity.ok(ApiResponse.ok("Template copied", copied));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @GetMapping("/templates/copied")
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<ApiResponse<CopiedSelfAssessmentFormTemplateDto>> getCopiedTemplate(
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            return selfAssessmentFormService.getCopiedTemplate(principal.getId())
                    .map(copied -> ResponseEntity.ok(ApiResponse.ok("Copied template retrieved", copied)))
                    .orElse(ResponseEntity.ok(ApiResponse.ok("No copied template", null)));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @DeleteMapping("/templates/copied")
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<ApiResponse<Void>> deleteCopiedTemplate(@AuthenticationPrincipal UserPrincipal principal) {
        try {
            selfAssessmentFormService.deleteCopiedTemplate(principal.getId());
            return ResponseEntity.ok(ApiResponse.ok("Copied template cleared", null));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PostMapping("/templates/active-check")
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<ApiResponse<List<TemplateActiveCheckResultDto>>> checkActiveTemplateConflicts(
            @Valid @RequestBody TemplateActiveCheckRequest request) {
        try {
            List<TemplateActiveCheckResultDto> conflicts = selfAssessmentFormService.findActiveTemplateConflicts(request);
            return ResponseEntity.ok(ApiResponse.ok("Template conflicts checked", conflicts));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @GetMapping("/templates/{id}")
    @PreAuthorize("principal.roleId == 1 or principal.roleId == 2")
    public ResponseEntity<ApiResponse<SelfAssessmentFormTemplateDto>> getTemplateById(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        try {
            Employee employee = getEmployeeFromPrincipal(principal);
            SelfAssessmentFormTemplateDto template = selfAssessmentFormService.getTemplateByIdForRole(
                    id, principal.getId(), principal.getRoleId(), employee);
            return ResponseEntity.ok(ApiResponse.ok("Template retrieved", template));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @GetMapping("/templates/active")
    public ResponseEntity<ApiResponse<SelfAssessmentFormTemplateDto>> getActiveTemplate(
            @RequestParam Long departmentId,
            @RequestParam Long positionId,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            return selfAssessmentFormService.getActiveTemplate(departmentId, positionId)
                    .map(t -> ResponseEntity.ok(ApiResponse.ok("Active template found", t)))
                    .orElse(ResponseEntity.ok(ApiResponse.ok("No active template", null)));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PostMapping("/templates")
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<ApiResponse<SelfAssessmentFormTemplateDto>> createTemplate(
            @Valid @RequestBody CreateTemplateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            SelfAssessmentFormTemplateDto template = selfAssessmentFormService.createTemplate(request, principal.getId());
            return ResponseEntity.ok(ApiResponse.ok("Template created", template));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PutMapping("/templates/{id}")
    @PreAuthorize("principal.roleId == 1 or principal.roleId == 2")
    public ResponseEntity<ApiResponse<SelfAssessmentFormTemplateDto>> updateTemplate(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTemplateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            Employee employee = getEmployeeFromPrincipal(principal);
            SelfAssessmentFormTemplateDto template = selfAssessmentFormService.updateTemplateForRole(
                    id, request, principal.getId(), principal.getRoleId(), employee);
            return ResponseEntity.ok(ApiResponse.ok("Template updated", template));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PostMapping("/templates/{templateId}/set-deadline")
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<ApiResponse<SetTemplateDeadlineResponse>> setTemplateDeadline(
            @PathVariable Long templateId,
            @Valid @RequestBody SetTemplateDeadlineRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            SetTemplateDeadlineResponse response = selfAssessmentFormService.setTemplateDeadline(templateId, request, principal.getId());
            return ResponseEntity.ok(ApiResponse.ok("Deadline set and forms assigned", response));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PostMapping("/notifications/due-tomorrow")
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<ApiResponse<Void>> createDueTomorrowNotifications(@AuthenticationPrincipal UserPrincipal principal) {
        try {
            selfAssessmentFormService.createDueTomorrowNotifications();
            return ResponseEntity.ok(ApiResponse.ok("Notifications created", null));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    private Employee getEmployeeFromPrincipal(UserPrincipal principal) {
        return employeeRepository.findByEmployeeId(principal.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));
    }
}
