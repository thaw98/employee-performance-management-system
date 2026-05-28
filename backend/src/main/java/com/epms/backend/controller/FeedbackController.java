package com.epms.backend.controller;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.FeedbackDraftDto;
import com.epms.backend.dto.FeedbackAuditEvaluateeHistoryDto;
import com.epms.backend.dto.FeedbackAuditHistoryFilter;
import com.epms.backend.dto.FeedbackAuditSummaryPageDto;
import com.epms.backend.dto.FeedbackHistoryFilter;
import com.epms.backend.dto.FeedbackHistoryDto;
import com.epms.backend.dto.FeedbackSubmissionRequest;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.Department;
import com.epms.backend.entity.User;
import com.epms.backend.repository.DepartmentRepository;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.service.FeedbackService;
import com.epms.backend.service.TimeSettingService;
import com.epms.backend.dto.TimeSettingDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;
    private final TimeSettingService timeSettingService;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> submitFeedback(@RequestBody FeedbackSubmissionRequest request) {
        try {
            User user = getCurrentUser();
            feedbackService.submitFeedback(user.getEmployee().getId(), request);
            return ResponseEntity.ok(new ApiResponse<>(true, "Feedback submitted successfully", null));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Submit Error: " + e.getMessage(), null));
        }
    }

    @PostMapping("/draft")
    public ResponseEntity<ApiResponse<FeedbackDraftDto>> saveDraft(@RequestBody FeedbackSubmissionRequest request) {
        try {
            User user = getCurrentUser();
            FeedbackDraftDto draft = feedbackService.saveDraft(user.getEmployee().getId(), request);
            return ResponseEntity.ok(new ApiResponse<>(true, "Draft saved", draft));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Draft Save Error: " + e.getMessage(), null));
        }
    }

    @GetMapping("/draft")
    public ResponseEntity<ApiResponse<FeedbackDraftDto>> getDraft(
            @RequestParam Long evaluateeId,
            @RequestParam String role) {
        try {
            User user = getCurrentUser();
            FeedbackDraftDto draft = feedbackService.getDraft(user.getEmployee().getId(), evaluateeId, role);
            return ResponseEntity.ok(new ApiResponse<>(true, "Draft fetched", draft));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Draft Load Error: " + e.getMessage(), null));
        }
    }

    @GetMapping("/drafts")
    public ResponseEntity<ApiResponse<List<FeedbackDraftDto>>> getDrafts() {
        try {
            User user = getCurrentUser();
            List<FeedbackDraftDto> drafts = feedbackService.getDrafts(user.getEmployee().getId());
            return ResponseEntity.ok(new ApiResponse<>(true, "Drafts fetched", drafts));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Draft List Error: " + e.getMessage(), null));
        }
    }

    @DeleteMapping("/draft/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDraft(@PathVariable Long id) {
        try {
            User user = getCurrentUser();
            feedbackService.deleteDraft(user.getEmployee().getId(), id);
            return ResponseEntity.ok(new ApiResponse<>(true, "Draft deleted", null));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Draft Delete Error: " + e.getMessage(), null));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<Page<FeedbackHistoryDto>>> getHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long reviewCycleId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(required = false) String reviewer,
            @RequestParam(required = false) String reviewee,
            @RequestParam(required = false) String feedbackType) {
        try {
            User user = getCurrentUser();
            FeedbackHistoryFilter filter = new FeedbackHistoryFilter();
            filter.setReviewCycleId(reviewCycleId);
            filter.setStatus(status);
            filter.setFromDate(fromDate);
            filter.setToDate(toDate);
            filter.setReviewer(reviewer);
            filter.setReviewee(reviewee);
            filter.setFeedbackType(feedbackType);
            Page<FeedbackHistoryDto> history = feedbackService.getFeedbackHistory(user.getEmployee().getId(), filter, PageRequest.of(page, size));
            return ResponseEntity.ok(new ApiResponse<>(true, "History fetched", history));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "History Error: " + e.getMessage(), null));
        }
    }

    @GetMapping("/received")
    public ResponseEntity<ApiResponse<Page<FeedbackHistoryDto>>> getReceived(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            User user = getCurrentUser();
            Page<FeedbackHistoryDto> received = feedbackService.getReceivedFeedback(user.getEmployee().getId(), PageRequest.of(page, size));
            return ResponseEntity.ok(new ApiResponse<>(true, "Received feedback fetched", received));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Received Error: " + e.getMessage(), null));
        }
    }

    @GetMapping("/combined-history")
    public ResponseEntity<ApiResponse<Page<FeedbackHistoryDto>>> getCombinedHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String direction,
            @RequestParam(required = false) Long reviewCycleId,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(required = false) String feedbackType,
            @RequestParam(required = false) String peopleSearch) {
        try {
            User user = getCurrentUser();
            FeedbackHistoryFilter filter = new FeedbackHistoryFilter();
            filter.setDirection(direction);
            filter.setReviewCycleId(reviewCycleId);
            filter.setFromDate(fromDate);
            filter.setToDate(toDate);
            filter.setFeedbackType(feedbackType);
            filter.setPeopleSearch(peopleSearch);
            Page<FeedbackHistoryDto> history = feedbackService.getCombinedFeedbackHistory(user.getEmployee().getId(), filter, PageRequest.of(page, size));
            return ResponseEntity.ok(new ApiResponse<>(true, "Combined feedback history fetched", history));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Combined History Error: " + e.getMessage(), null));
        }
    }

    @GetMapping("/audit/history-summary")
    public ResponseEntity<ApiResponse<FeedbackAuditSummaryPageDto>> getAuditHistorySummary(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) Long reviewCycleId,
            @RequestParam(required = false) String feedbackType,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate) {
        try {
            User user = getCurrentUser();
            if (!isAudit(user)) {
                return ResponseEntity.status(403).body(new ApiResponse<>(false, "Access denied", null));
            }
            FeedbackAuditHistoryFilter filter = new FeedbackAuditHistoryFilter();
            filter.setSearch(search);
            filter.setDepartment(department);
            filter.setReviewCycleId(reviewCycleId);
            filter.setFeedbackType(feedbackType);
            filter.setFromDate(fromDate);
            filter.setToDate(toDate);
            FeedbackAuditSummaryPageDto summary = feedbackService.getAuditHistorySummary(filter, PageRequest.of(page, size));
            return ResponseEntity.ok(new ApiResponse<>(true, "Audit feedback summary fetched", summary));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Audit Summary Error: " + e.getMessage(), null));
        }
    }

    @GetMapping("/audit/evaluatees/{employeeId}/history")
    public ResponseEntity<ApiResponse<FeedbackAuditEvaluateeHistoryDto>> getAuditEvaluateeHistory(
            @PathVariable Long employeeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) Long reviewCycleId,
            @RequestParam(required = false) String feedbackType,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate) {
        try {
            User user = getCurrentUser();
            if (!isAudit(user)) {
                return ResponseEntity.status(403).body(new ApiResponse<>(false, "Access denied", null));
            }
            FeedbackAuditHistoryFilter filter = new FeedbackAuditHistoryFilter();
            filter.setDepartment(department);
            filter.setReviewCycleId(reviewCycleId);
            filter.setFeedbackType(feedbackType);
            filter.setFromDate(fromDate);
            filter.setToDate(toDate);
            FeedbackAuditEvaluateeHistoryDto history = feedbackService.getAuditEvaluateeHistory(employeeId, filter, PageRequest.of(page, size));
            return ResponseEntity.ok(new ApiResponse<>(true, "Audit evaluatee feedback history fetched", history));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Audit Evaluatee History Error: " + e.getMessage(), null));
        }
    }

    @GetMapping("/eligible-evaluatees")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getEligible(@RequestParam String role) {
        try {
            User user = getCurrentUser();
            List<Employee> eligible = feedbackService.getEligibleEvaluatees(user.getEmployee().getId(), role);

            // Calculate current role count
            TimeSettingDto cycle = timeSettingService.getCurrentCycleRange();
            Instant start = cycle.getStartDate().atStartOfDay(ZoneId.systemDefault()).toInstant();
            Instant end = cycle.getEndDate().plusDays(1).atStartOfDay(ZoneId.systemDefault()).minusNanos(1).toInstant();
            long roleCount = feedbackService.countFeedbacksByRoleInCycle(user.getEmployee().getId(), role, start, end);

            List<Map<String, Object>> list = eligible.stream().map(e -> {
                boolean given = feedbackService.isFeedbackGivenInCurrentCycle(user.getEmployee().getId(), e.getId());
                Map<String, Object> m = new HashMap<>();
                m.put("id", e.getId());
                m.put("name", e.getEmployeeName());
                m.put("staffNo", e.getEmployeeId());
                m.put("levelCode", e.getPosition() != null && e.getPosition().getLevelCode() != null
                        ? e.getPosition().getLevelCode().getCode()
                        : null);
                m.put("position", e.getPosition() != null ? e.getPosition().getName() : "N/A");
                m.put("department", e.getDepartment() != null ? e.getDepartment().getName() : "N/A");
                m.put("profilePictureUrl", e.getProfilePictureUrl());
                m.put("given", given);
                m.put("statusText", given ? "Feedback already given" : "Not given yet");
                return m;
            }).collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("evaluatees", list);
            response.put("roleFeedbackCount", roleCount);
            response.put("roleFeedbackLimit", 5);

            return ResponseEntity.ok(new ApiResponse<>(true, "Eligible evaluatees fetched", response));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Eligible Load Error: " + e.getMessage(), null));
        }
    }

    @GetMapping("/evaluator-info")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getEvaluatorInfo() {
        try {
            User user = getCurrentUser();
            Employee e = user.getEmployee();
            if (e == null) throw new RuntimeException("Evaluator employee record missing");

            Map<String, Object> info = new HashMap<>();
            info.put("name", e.getEmployeeName());
            info.put("position", e.getPosition() != null ? e.getPosition().getName() : "N/A");
            info.put("department", e.getDepartment() != null ? e.getDepartment().getName() : "N/A");
            info.put("profilePictureUrl", e.getProfilePictureUrl());
            info.put("date", LocalDate.now().toString());
            return ResponseEntity.ok(new ApiResponse<>(true, "Evaluator info fetched", info));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Evaluator Info Error: " + e.getMessage(), null));
        }
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<ApiResponse<List<com.epms.backend.dto.FeedbackDetailDto>>> getDetails(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(new ApiResponse<>(true, "Details fetched", feedbackService.getFeedbackDetails(id)));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Details Error: " + e.getMessage(), null));
        }
    }

    // Reports
    @GetMapping("/reports/manager-departments")
    public ResponseEntity<ApiResponse<List<com.epms.backend.dto.FeedbackReportDtos.ReportDepartmentDto>>> getManagerReportDepartments() {
        try {
            User user = getCurrentUser();
            if (isHr(user)) {
                return ResponseEntity.ok(new ApiResponse<>(true, "Departments fetched", departmentRepository.findAll().stream()
                        .map(this::mapReportDepartment)
                        .collect(Collectors.toList())));
            }
            if (!isManager(user)) {
                return ResponseEntity.ok(new ApiResponse<>(true, "Departments fetched", List.of()));
            }

            Department managerDepartment = user.getEmployee() != null ? user.getEmployee().getDepartment() : null;
            if (managerDepartment == null) {
                return ResponseEntity.ok(new ApiResponse<>(true, "Departments fetched", List.of()));
            }

            List<com.epms.backend.dto.FeedbackReportDtos.ReportDepartmentDto> data = List.of(mapReportDepartment(managerDepartment));
            return ResponseEntity.ok(new ApiResponse<>(true, "Departments fetched", data));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Report Departments Error: " + e.getMessage(), null));
        }
    }

    @GetMapping("/reports/department/{departmentId}/criteria-averages")
    public ResponseEntity<ApiResponse<List<com.epms.backend.dto.FeedbackReportDtos.CriteriaAverageDto>>> getCriteriaAverages(
            @PathVariable Long departmentId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Long reviewCycleId
    ) {
        try {
            User user = getCurrentUser();
            if (!canAccessDepartmentReport(user, departmentId)) {
                return ResponseEntity.status(403).body(new ApiResponse<>(false, "Access denied", null));
            }

            LocalDate fromDate = from != null && !from.isBlank() ? LocalDate.parse(from) : null;
            LocalDate toDate = to != null && !to.isBlank() ? LocalDate.parse(to) : null;
            List<com.epms.backend.dto.FeedbackReportDtos.CriteriaAverageDto> data = feedbackService.getCriteriaAveragesForDepartment(departmentId, fromDate, toDate, reviewCycleId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Criteria averages fetched", data));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Criteria Averages Error: " + e.getMessage(), null));
        }
    }

    @GetMapping("/reports/criteria-averages")
    public ResponseEntity<ApiResponse<List<com.epms.backend.dto.FeedbackReportDtos.CriteriaAverageDto>>> getCompanyCriteriaAverages(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Long reviewCycleId
    ) {
        try {
            User user = getCurrentUser();
            if (!isHr(user)) {
                return ResponseEntity.status(403).body(new ApiResponse<>(false, "Access denied", null));
            }

            LocalDate fromDate = from != null && !from.isBlank() ? LocalDate.parse(from) : null;
            LocalDate toDate = to != null && !to.isBlank() ? LocalDate.parse(to) : null;
            List<com.epms.backend.dto.FeedbackReportDtos.CriteriaAverageDto> data = feedbackService.getCriteriaAveragesForDepartment(null, fromDate, toDate, reviewCycleId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Company criteria averages fetched", data));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Company Criteria Averages Error: " + e.getMessage(), null));
        }
    }

    @GetMapping("/reports/department/{departmentId}/employee-ranking")
    public ResponseEntity<ApiResponse<List<com.epms.backend.dto.FeedbackReportDtos.EmployeeRankingDto>>> getEmployeeRanking(
            @PathVariable Long departmentId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Long criteriaId,
            @RequestParam(required = false, defaultValue = "desc") String order,
            @RequestParam(required = false) Long reviewCycleId
    ) {
        try {
            User user = getCurrentUser();
            if (!canAccessDepartmentReport(user, departmentId)) {
                return ResponseEntity.status(403).body(new ApiResponse<>(false, "Access denied", null));
            }

            LocalDate fromDate = from != null && !from.isBlank() ? LocalDate.parse(from) : null;
            LocalDate toDate = to != null && !to.isBlank() ? LocalDate.parse(to) : null;
            boolean asc = "asc".equalsIgnoreCase(order);
            List<com.epms.backend.dto.FeedbackReportDtos.EmployeeRankingDto> data = feedbackService.getEmployeeRankingForDepartment(departmentId, fromDate, toDate, criteriaId, asc, reviewCycleId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Employee ranking fetched", data));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Employee Ranking Error: " + e.getMessage(), null));
        }
    }

    @GetMapping("/reports/department/{departmentId}/employee/{employeeId}")
    public ResponseEntity<ApiResponse<com.epms.backend.dto.FeedbackReportDtos.EmployeeFeedbackDetailReportDto>> getEmployeeFeedbackDetail(
            @PathVariable Long departmentId,
            @PathVariable Long employeeId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Long reviewCycleId
    ) {
        try {
            User user = getCurrentUser();
            boolean isOwnEmployeeReport = user.getEmployee() != null
                    && user.getEmployee().getId().equals(employeeId)
                    && user.getEmployee().getDepartment() != null
                    && user.getEmployee().getDepartment().getId().equals(departmentId);
            if (!canAccessDepartmentReport(user, departmentId) && !isOwnEmployeeReport) {
                return ResponseEntity.status(403).body(new ApiResponse<>(false, "Access denied", null));
            }
            if (!feedbackService.employeeBelongsToDepartment(employeeId, departmentId)) {
                return ResponseEntity.status(403).body(new ApiResponse<>(false, "Employee is outside the selected department", null));
            }

            LocalDate fromDate = from != null && !from.isBlank() ? LocalDate.parse(from) : null;
            LocalDate toDate = to != null && !to.isBlank() ? LocalDate.parse(to) : null;
            com.epms.backend.dto.FeedbackReportDtos.EmployeeFeedbackDetailReportDto data =
                    feedbackService.getEmployeeFeedbackDetailForDepartment(departmentId, employeeId, fromDate, toDate, reviewCycleId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Employee feedback detail fetched", data));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Employee Feedback Detail Error: " + e.getMessage(), null));
        }
    }

    @GetMapping("/reports/me")
    public ResponseEntity<ApiResponse<com.epms.backend.dto.FeedbackReportDtos.EmployeeFeedbackDetailReportDto>> getMyFeedbackReport(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Long reviewCycleId
    ) {
        try {
            User user = getCurrentUser();
            if (user.getEmployee() == null || user.getEmployee().getDepartment() == null) {
                return ResponseEntity.status(403).body(new ApiResponse<>(false, "Access denied", null));
            }

            LocalDate fromDate = from != null && !from.isBlank() ? LocalDate.parse(from) : null;
            LocalDate toDate = to != null && !to.isBlank() ? LocalDate.parse(to) : null;
            com.epms.backend.dto.FeedbackReportDtos.EmployeeFeedbackDetailReportDto data =
                    feedbackService.getEmployeeFeedbackDetailForDepartment(
                            user.getEmployee().getDepartment().getId(),
                            user.getEmployee().getId(),
                            fromDate,
                            toDate,
                            reviewCycleId);
            return ResponseEntity.ok(new ApiResponse<>(true, "My feedback report fetched", data));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "My Feedback Report Error: " + e.getMessage(), null));
        }
    }

    @GetMapping("/reports/employee-ranking")
    public ResponseEntity<ApiResponse<List<com.epms.backend.dto.FeedbackReportDtos.EmployeeRankingDto>>> getCompanyEmployeeRanking(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Long criteriaId,
            @RequestParam(required = false, defaultValue = "desc") String order,
            @RequestParam(required = false) Long reviewCycleId
    ) {
        try {
            User user = getCurrentUser();
            if (!isHr(user)) {
                return ResponseEntity.status(403).body(new ApiResponse<>(false, "Access denied", null));
            }

            LocalDate fromDate = from != null && !from.isBlank() ? LocalDate.parse(from) : null;
            LocalDate toDate = to != null && !to.isBlank() ? LocalDate.parse(to) : null;
            boolean asc = "asc".equalsIgnoreCase(order);
            List<com.epms.backend.dto.FeedbackReportDtos.EmployeeRankingDto> data = feedbackService.getEmployeeRankingForDepartment(null, fromDate, toDate, criteriaId, asc, reviewCycleId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Company employee ranking fetched", data));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Company Employee Ranking Error: " + e.getMessage(), null));
        }
    }

    @GetMapping("/reports/top-bottom-employees")
    public ResponseEntity<ApiResponse<com.epms.backend.dto.FeedbackReportDtos.TopBottomEmployeeSummaryDto>> getTopBottomEmployees(
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Long reviewCycleId
    ) {
        try {
            User user = getCurrentUser();
            Long scopedDepartmentId = departmentId;
            if (!isHr(user)) {
                if (!isManager(user)) {
                    return ResponseEntity.status(403).body(new ApiResponse<>(false, "Access denied", null));
                }
                scopedDepartmentId = user.getEmployee() != null && user.getEmployee().getDepartment() != null
                        ? user.getEmployee().getDepartment().getId()
                        : null;
                if (scopedDepartmentId == null) {
                    return ResponseEntity.status(403).body(new ApiResponse<>(false, "Access denied", null));
                }
            } else if (departmentId != null && !departmentRepository.existsById(departmentId)) {
                return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Department not found", null));
            }

            LocalDate fromDate = from != null && !from.isBlank() ? LocalDate.parse(from) : null;
            LocalDate toDate = to != null && !to.isBlank() ? LocalDate.parse(to) : null;
            com.epms.backend.dto.FeedbackReportDtos.TopBottomEmployeeSummaryDto data =
                    feedbackService.getTopBottomEmployeeSummary(scopedDepartmentId, fromDate, toDate, reviewCycleId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Top and bottom employees fetched", data));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Top Bottom Employee Error: " + e.getMessage(), null));
        }
    }

    @GetMapping("/reports/averages-by-department")
    public ResponseEntity<ApiResponse<List<com.epms.backend.dto.FeedbackReportDtos.DepartmentAverageDto>>> getAveragesByDepartment(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Long reviewCycleId
    ) {
        try {
            User user = getCurrentUser();
            if (!isHr(user)) {
                return ResponseEntity.status(403).body(new ApiResponse<>(false, "Access denied", null));
            }

            LocalDate fromDate = from != null && !from.isBlank() ? LocalDate.parse(from) : null;
            LocalDate toDate = to != null && !to.isBlank() ? LocalDate.parse(to) : null;
            List<com.epms.backend.dto.FeedbackReportDtos.DepartmentAverageDto> data = feedbackService.getAverageByDepartment(fromDate, toDate, reviewCycleId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Averages by department fetched", data));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Averages By Department Error: " + e.getMessage(), null));
        }
    }

    @GetMapping("/reports/trends")
    public ResponseEntity<ApiResponse<List<com.epms.backend.dto.FeedbackReportDtos.DepartmentTrendDto>>> getDepartmentTrends(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Long fromReviewCycleId,
            @RequestParam(required = false) Long toReviewCycleId
    ) {
        try {
            User user = getCurrentUser();
            if (!isHr(user)) {
                return ResponseEntity.status(403).body(new ApiResponse<>(false, "Access denied", null));
            }

            LocalDate fromDate = from != null && !from.isBlank() ? LocalDate.parse(from) : null;
            LocalDate toDate = to != null && !to.isBlank() ? LocalDate.parse(to) : null;
            List<com.epms.backend.dto.FeedbackReportDtos.DepartmentTrendDto> data = feedbackService.getDepartmentTrends(fromDate, toDate, fromReviewCycleId, toReviewCycleId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Department trends fetched", data));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Trends Error: " + e.getMessage(), null));
        }
    }

    @GetMapping("/reports/export-data")
    public ResponseEntity<ApiResponse<List<com.epms.backend.dto.FeedbackReportDtos.EmployeeFeedbackDetailReportDto>>> getFeedbackReportExportData(
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Long reviewCycleId
    ) {
        try {
            User user = getCurrentUser();
            Long scopedDepartmentId = departmentId;
            if (!isHr(user)) {
                scopedDepartmentId = user.getEmployee() != null && user.getEmployee().getDepartment() != null
                        ? user.getEmployee().getDepartment().getId()
                        : null;
                if (scopedDepartmentId == null) {
                    return ResponseEntity.status(403).body(new ApiResponse<>(false, "Access denied", null));
                }
            } else if (departmentId != null && !departmentRepository.existsById(departmentId)) {
                return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Department not found", null));
            }

            LocalDate fromDate = from != null && !from.isBlank() ? LocalDate.parse(from) : null;
            LocalDate toDate = to != null && !to.isBlank() ? LocalDate.parse(to) : null;
            List<com.epms.backend.dto.FeedbackReportDtos.EmployeeFeedbackDetailReportDto> data =
                    feedbackService.getEmployeeFeedbackDetailsForReport(scopedDepartmentId, fromDate, toDate, reviewCycleId);
            if (!isHr(user) && !isManager(user) && user.getEmployee() != null) {
                Long ownEmployeeId = user.getEmployee().getId();
                data = data.stream()
                        .filter(row -> row.getEmployeeId() != null && row.getEmployeeId().equals(ownEmployeeId))
                        .toList();
            }
            return ResponseEntity.ok(new ApiResponse<>(true, "Feedback report export data fetched", data));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Feedback Report Export Error: " + e.getMessage(), null));
        }
    }

    @GetMapping("/time-settings")
    public ResponseEntity<ApiResponse<TimeSettingDto>> getTimeSettings() {
        try {
            return ResponseEntity.ok(new ApiResponse<>(true, "Fetched settings", timeSettingService.getSettings()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Error fetching settings: " + e.getMessage(), null));
        }
    }

    @PostMapping("/time-settings")
    public ResponseEntity<ApiResponse<TimeSettingDto>> saveTimeSettings(@RequestBody TimeSettingDto dto) {
        try {
            if (dto.getYearType() == null || dto.getDuration() == null) {
                return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Required fields cannot be empty", null));
            }
            User user = getCurrentUser();
            Long roleId = user.getRole() != null ? user.getRole().getId() : null;
            return ResponseEntity.ok(new ApiResponse<>(true, "Settings saved successfully", timeSettingService.saveSettings(dto, user.getId(), roleId)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Error saving settings: " + e.getMessage(), null));
        }
    }

    private User getCurrentUser() {
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            Long userId = Long.parseLong(userIdStr);
            return userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        } catch (NumberFormatException e) {
            throw new RuntimeException("Invalid user ID in security context: " + userIdStr);
        }
    }

    private boolean isHr(User user) {
        if (user == null || user.getRole() == null) {
            return false;
        }
        Long roleId = user.getRole().getId();
        String roleName = user.getRole().getName();
        return Long.valueOf(1L).equals(roleId)
                || Long.valueOf(5L).equals(roleId)
                || (roleName != null && (roleName.equalsIgnoreCase("HR") || roleName.equalsIgnoreCase("AUDIT")));
    }

    private boolean isAudit(User user) {
        if (user == null || user.getRole() == null) {
            return false;
        }
        Long roleId = user.getRole().getId();
        String roleName = user.getRole().getName();
        return Long.valueOf(5L).equals(roleId)
                || (roleName != null && roleName.equalsIgnoreCase("AUDIT"));
    }

    private boolean isManager(User user) {
        return user.getRole() != null
                && user.getRole().getName() != null
                && user.getRole().getName().equalsIgnoreCase("MANAGER");
    }

    private boolean canAccessDepartmentReport(User user, Long departmentId) {
        if (isHr(user)) {
            return true;
        }
        if (!isManager(user)) {
            return false;
        }
        Long managerDepartmentId = user.getEmployee() != null && user.getEmployee().getDepartment() != null
                ? user.getEmployee().getDepartment().getId()
                : null;
        return managerDepartmentId != null && managerDepartmentId.equals(departmentId);
    }

    private com.epms.backend.dto.FeedbackReportDtos.ReportDepartmentDto mapReportDepartment(Department department) {
        return new com.epms.backend.dto.FeedbackReportDtos.ReportDepartmentDto(
                department.getId(),
                department.getName());
    }
}
