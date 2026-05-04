package com.epms.backend.controller;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.selfassessmentform.QuestionBankDto;
import com.epms.backend.dto.selfassessmentform.QuestionBankRequest;
import com.epms.backend.dto.selfassessmentform.QuestionBankStatusRequest;
import com.epms.backend.security.UserPrincipal;
import com.epms.backend.service.QuestionBankService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/self-assessment-forms/question-bank")
@RequiredArgsConstructor
@PreAuthorize("principal.roleId == 1 or principal.roleId == 2")
public class QuestionBankController {

    private final QuestionBankService questionBankService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<QuestionBankDto>>> getQuestions(
            @RequestParam(defaultValue = "false") boolean includeInactive,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            List<QuestionBankDto> questions = questionBankService.getQuestions(includeInactive, principal.getId(), principal.getRoleId());
            return ResponseEntity.ok(ApiResponse.ok("Question bank retrieved", questions));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<QuestionBankDto>> createQuestion(
            @Valid @RequestBody QuestionBankRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            QuestionBankDto question = questionBankService.createQuestion(request, principal.getId(), principal.getRoleId());
            return ResponseEntity.ok(ApiResponse.ok("Question created", question));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<QuestionBankDto>> updateQuestion(
            @PathVariable Long id,
            @Valid @RequestBody QuestionBankRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            QuestionBankDto question = questionBankService.updateQuestion(id, request, principal.getId(), principal.getRoleId());
            return ResponseEntity.ok(ApiResponse.ok("Question updated", question));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PatchMapping("/{id}/active")
    public ResponseEntity<ApiResponse<QuestionBankDto>> updateStatus(
            @PathVariable Long id,
            @RequestBody QuestionBankStatusRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            QuestionBankDto question = questionBankService.updateStatus(id, request.isActive(), principal.getId(), principal.getRoleId());
            return ResponseEntity.ok(ApiResponse.ok("Question status updated", question));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }
}
