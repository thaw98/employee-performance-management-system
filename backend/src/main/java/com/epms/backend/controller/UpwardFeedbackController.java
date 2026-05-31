package com.epms.backend.controller;

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
import org.springframework.web.bind.annotation.RestController;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.upwardfeedback.UpwardFeedbackCreateRequest;
import com.epms.backend.dto.upwardfeedback.UpwardFeedbackDto;
import com.epms.backend.dto.upwardfeedback.UpwardFeedbackReplyDto;
import com.epms.backend.dto.upwardfeedback.UpwardFeedbackReplyRequest;
import com.epms.backend.entity.User;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.security.UserPrincipal;
import com.epms.backend.service.UpwardFeedbackService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/upward-feedback")
@RequiredArgsConstructor
@PreAuthorize("@permissionGuard.has('CONTINUOUS_FEEDBACK', 'view')")
public class UpwardFeedbackController {

    private final UpwardFeedbackService service;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasRole('EMPLOYEE') and @permissionGuard.has('CONTINUOUS_FEEDBACK', 'create')")
    public ResponseEntity<ApiResponse<UpwardFeedbackDto>> createFeedback(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody UpwardFeedbackCreateRequest request) {
        User currentUser = userRepository.findById(principal.getId()).orElseThrow();
        UpwardFeedbackDto result = service.createUpwardFeedback(request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Upward feedback submitted successfully", result));
    }

    @PostMapping("/{feedbackId}/reply")
    public ResponseEntity<ApiResponse<UpwardFeedbackReplyDto>> addReply(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long feedbackId,
            @RequestBody UpwardFeedbackReplyRequest request) {
        User currentUser = userRepository.findById(principal.getId()).orElseThrow();
        UpwardFeedbackReplyDto result = service.addReply(feedbackId, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Reply added successfully", result));
    }

    @PatchMapping("/{feedbackId}/close")
    public ResponseEntity<ApiResponse<UpwardFeedbackDto>> closeFeedback(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long feedbackId) {
        User currentUser = userRepository.findById(principal.getId()).orElseThrow();
        UpwardFeedbackDto result = service.closeFeedback(feedbackId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Feedback closed successfully", result));
    }

    @GetMapping("/{feedbackId}")
    public ResponseEntity<ApiResponse<UpwardFeedbackDto>> getFeedback(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long feedbackId) {
        User currentUser = userRepository.findById(principal.getId()).orElseThrow();
        UpwardFeedbackDto result = service.getFeedbackDetail(feedbackId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Feedback retrieved successfully", result));
    }

    @GetMapping("/my-sent")
    @PreAuthorize("hasRole('EMPLOYEE') and @permissionGuard.has('CONTINUOUS_FEEDBACK', 'view')")
    public ResponseEntity<ApiResponse<List<UpwardFeedbackDto>>> getMySentFeedback(
            @AuthenticationPrincipal UserPrincipal principal) {
        User currentUser = userRepository.findById(principal.getId()).orElseThrow();
        List<UpwardFeedbackDto> result = service.getMySentFeedback(currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Sent feedback retrieved successfully", result));
    }

    @GetMapping("/my-received")
    public ResponseEntity<ApiResponse<List<UpwardFeedbackDto>>> getMyReceivedFeedback(
            @AuthenticationPrincipal UserPrincipal principal) {
        User currentUser = userRepository.findById(principal.getId()).orElseThrow();
        List<UpwardFeedbackDto> result = service.getMyReceivedFeedback(currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Received feedback retrieved successfully", result));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('HR', 'AUDIT') and @permissionGuard.has('CONTINUOUS_FEEDBACK', 'view')")
    public ResponseEntity<ApiResponse<List<UpwardFeedbackDto>>> listAll(
            @AuthenticationPrincipal UserPrincipal principal) {
        User currentUser = userRepository.findById(principal.getId()).orElseThrow();
        List<UpwardFeedbackDto> result = service.listAll(currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Upward feedback list retrieved successfully", result));
    }
}
