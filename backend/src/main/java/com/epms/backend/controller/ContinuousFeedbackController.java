package com.epms.backend.controller;

import java.time.Instant;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.MeetingResponse;
import com.epms.backend.dto.continuousfeedback.ContinuousFeedbackActionItemDto;
import com.epms.backend.dto.continuousfeedback.ContinuousFeedbackActionItemRequest;
import com.epms.backend.dto.continuousfeedback.ContinuousFeedbackActionItemStatusUpdateRequest;
import com.epms.backend.dto.continuousfeedback.ContinuousFeedbackCommentDto;
import com.epms.backend.dto.continuousfeedback.ContinuousFeedbackCommentRequest;
import com.epms.backend.dto.continuousfeedback.ContinuousFeedbackCreatePipRequest;
import com.epms.backend.dto.continuousfeedback.ContinuousFeedbackCreateRequest;
import com.epms.backend.dto.continuousfeedback.ContinuousFeedbackDashboardDto;
import com.epms.backend.dto.continuousfeedback.ContinuousFeedbackDto;
import com.epms.backend.dto.continuousfeedback.ContinuousFeedbackEvidenceDto;
import com.epms.backend.dto.continuousfeedback.ContinuousFeedbackPipWarningDto;
import com.epms.backend.dto.continuousfeedback.ContinuousFeedbackUpdatePrivateNoteRequest;
import com.epms.backend.dto.continuousfeedback.CreateFollowUpMeetingFromFeedbackRequest;
import com.epms.backend.entity.Pip;
import com.epms.backend.entity.User;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.security.UserPrincipal;
import com.epms.backend.service.ContinuousFeedbackService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/continuous-feedback")
@RequiredArgsConstructor
public class ContinuousFeedbackController {

    private final ContinuousFeedbackService service;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('DEPARTMENT_HEAD', 'TEAM_HEAD', 'MANAGER')")
    public ResponseEntity<ApiResponse<ContinuousFeedbackDto>> createFeedback(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody ContinuousFeedbackCreateRequest request) {
        User currentUser = userRepository.findById(principal.getId()).orElseThrow();
        ContinuousFeedbackDto result = service.createFeedback(request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Feedback created successfully", result));
    }

    @PatchMapping("/{feedbackId}/private-note")
    @PreAuthorize("hasAnyRole('DEPARTMENT_HEAD', 'TEAM_HEAD', 'MANAGER')")
    public ResponseEntity<ApiResponse<ContinuousFeedbackDto>> updatePrivateNote(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long feedbackId,
            @RequestBody ContinuousFeedbackUpdatePrivateNoteRequest request) {
        User currentUser = userRepository.findById(principal.getId()).orElseThrow();
        ContinuousFeedbackDto result = service.updatePrivateNote(feedbackId, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Private note updated successfully", result));
    }

    @PostMapping("/{feedbackId}/share")
    @PreAuthorize("hasAnyRole('DEPARTMENT_HEAD', 'TEAM_HEAD', 'MANAGER')")
    public ResponseEntity<ApiResponse<ContinuousFeedbackDto>> shareFeedback(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long feedbackId) {
        User currentUser = userRepository.findById(principal.getId()).orElseThrow();
        ContinuousFeedbackDto result = service.shareFeedback(feedbackId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Feedback shared successfully", result));
    }

    @GetMapping("/{feedbackId}")
    public ResponseEntity<ApiResponse<ContinuousFeedbackDto>> getFeedback(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long feedbackId) {
        User currentUser = userRepository.findById(principal.getId()).orElseThrow();
        ContinuousFeedbackDto result = service.getFeedbackDetail(feedbackId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Feedback retrieved successfully", result));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<ContinuousFeedbackDto>>> getMyFeedback(
            @AuthenticationPrincipal UserPrincipal principal) {
        User currentUser = userRepository.findById(principal.getId()).orElseThrow();
        List<ContinuousFeedbackDto> result = service.getMyFeedback(currentUser);
        return ResponseEntity.ok(ApiResponse.ok("My feedback retrieved successfully", result));
    }

    @GetMapping("/my-team")
    @PreAuthorize("hasAnyRole('DEPARTMENT_HEAD', 'TEAM_HEAD', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<ContinuousFeedbackDto>>> getTeamFeedback(
            @AuthenticationPrincipal UserPrincipal principal) {
        User currentUser = userRepository.findById(principal.getId()).orElseThrow();
        List<ContinuousFeedbackDto> result = service.getTeamFeedback(currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Team feedback retrieved successfully", result));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<ApiResponse<List<ContinuousFeedbackDto>>> getEmployeeFeedback(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long employeeId) {
        User currentUser = userRepository.findById(principal.getId()).orElseThrow();
        List<ContinuousFeedbackDto> result = service.getEmployeeFeedback(employeeId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Employee feedback retrieved successfully", result));
    }

    @PostMapping("/{feedbackId}/acknowledge")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<ApiResponse<ContinuousFeedbackDto>> acknowledgeFeedback(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long feedbackId) {
        User currentUser = userRepository.findById(principal.getId()).orElseThrow();
        ContinuousFeedbackDto result = service.acknowledgeFeedback(feedbackId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Feedback acknowledged successfully", result));
    }

    @PostMapping("/{feedbackId}/action-items")
    @PreAuthorize("hasAnyRole('DEPARTMENT_HEAD', 'TEAM_HEAD', 'MANAGER', 'HR')")
    public ResponseEntity<ApiResponse<ContinuousFeedbackActionItemDto>> addActionItem(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long feedbackId,
            @RequestBody ContinuousFeedbackActionItemRequest request) {
        User currentUser = userRepository.findById(principal.getId()).orElseThrow();
        ContinuousFeedbackActionItemDto result = service.addActionItem(feedbackId, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Action item created successfully", result));
    }

    @PatchMapping("/action-items/{actionItemId}/status")
    @PreAuthorize("hasAnyRole('DEPARTMENT_HEAD', 'TEAM_HEAD', 'MANAGER', 'HR')")
    public ResponseEntity<ApiResponse<ContinuousFeedbackActionItemDto>> updateActionItemStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long actionItemId,
            @RequestBody ContinuousFeedbackActionItemStatusUpdateRequest request) {
        User currentUser = userRepository.findById(principal.getId()).orElseThrow();
        ContinuousFeedbackActionItemDto result = service.updateActionItemStatus(actionItemId, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Action item status updated successfully", result));
    }

    @PostMapping("/{feedbackId}/comments")
    public ResponseEntity<ApiResponse<ContinuousFeedbackCommentDto>> addComment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long feedbackId,
            @RequestBody ContinuousFeedbackCommentRequest request) {
        User currentUser = userRepository.findById(principal.getId()).orElseThrow();
        ContinuousFeedbackCommentDto result = service.addComment(feedbackId, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Comment added successfully", result));
    }

    @GetMapping("/employee/{employeeId}/pip-warning")
    public ResponseEntity<ApiResponse<ContinuousFeedbackPipWarningDto>> getPipWarning(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long employeeId) {
        User currentUser = userRepository.findById(principal.getId()).orElseThrow();
        ContinuousFeedbackPipWarningDto result = service.getPipWarning(employeeId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("PIP warning status retrieved", result));
    }

    @PostMapping("/{feedbackId}/create-pip")
    @PreAuthorize("hasAnyRole('DEPARTMENT_HEAD', 'TEAM_HEAD', 'MANAGER', 'HR')")
    public ResponseEntity<ApiResponse<Pip>> createPipFromFeedback(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long feedbackId,
            @RequestBody(required = false) ContinuousFeedbackCreatePipRequest request) {
        User currentUser = userRepository.findById(principal.getId()).orElseThrow();
        if (request == null) {
            request = new ContinuousFeedbackCreatePipRequest();
        }
        Pip result = service.createPipFromFeedback(feedbackId, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("PIP created successfully", result));
    }

    @PostMapping("/{feedbackId}/create-meeting")
    @PreAuthorize("hasAnyRole('DEPARTMENT_HEAD', 'TEAM_HEAD', 'MANAGER', 'HR')")
    public ResponseEntity<ApiResponse<MeetingResponse>> createMeetingFromFeedback(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long feedbackId,
            @RequestBody(required = false) CreateFollowUpMeetingFromFeedbackRequest request) {
        User currentUser = userRepository.findById(principal.getId()).orElseThrow();
        if (request == null) {
            request = new CreateFollowUpMeetingFromFeedbackRequest();
        }
        MeetingResponse result = service.createFollowUpMeeting(feedbackId, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Follow-up meeting created successfully", result));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<ContinuousFeedbackDashboardDto>> getDashboard(
            @AuthenticationPrincipal UserPrincipal principal) {
        User currentUser = userRepository.findById(principal.getId()).orElseThrow();
        ContinuousFeedbackDashboardDto result = service.getDashboard(currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Dashboard data retrieved", result));
    }

    @GetMapping("/evidence/employee/{employeeId}")
    public ResponseEntity<ApiResponse<List<ContinuousFeedbackEvidenceDto>>> getEvidenceForEmployee(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long employeeId,
            @RequestParam(required = false) Instant startDate,
            @RequestParam(required = false) Instant endDate) {
        User currentUser = userRepository.findById(principal.getId()).orElseThrow();
        List<ContinuousFeedbackEvidenceDto> result = service.getEvidenceForEmployee(employeeId, startDate, endDate, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Evidence retrieved successfully", result));
    }
}
