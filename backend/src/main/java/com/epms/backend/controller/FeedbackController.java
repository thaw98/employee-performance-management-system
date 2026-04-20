package com.epms.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.FeedbackSessionDto;
import com.epms.backend.dto.FeedbackSubmissionDto;
import com.epms.backend.dto.FeedbackHistoryDto;
import com.epms.backend.dto.FeedbackTargetDto;
import com.epms.backend.dto.DepartmentPositionDto;
import com.epms.backend.service.FeedbackService;
import java.util.List;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @GetMapping("/targets")
    public ResponseEntity<ApiResponse<FeedbackSessionDto>> getTargets(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.ok("Targets fetched successfully", feedbackService.getTargets(authentication.getName())));
    }

    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<Void>> submitFeedback(Authentication authentication, @RequestBody FeedbackSubmissionDto dto) {
        feedbackService.submitFeedback(authentication.getName(), dto);
        return ResponseEntity.ok(ApiResponse.ok("Feedback submitted successfully", null));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<FeedbackHistoryDto>>> getHistory(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.ok("History fetched successfully", feedbackService.getHistory(authentication.getName())));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<FeedbackTargetDto>> getMe(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.ok("Evaluator info fetched", feedbackService.mapToTargetDtoById(authentication.getName())));
    }

    @GetMapping("/roles")
    public ResponseEntity<ApiResponse<List<DepartmentPositionDto>>> getRoles(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.ok("Roles fetched successfully", feedbackService.getRolesForUser(authentication.getName())));
    }

    @GetMapping("/my-department")
    public ResponseEntity<ApiResponse<String>> getMyDepartment(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.ok("Department fetched", feedbackService.getUserDepartmentName(authentication.getName())));
    }
}
