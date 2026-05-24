package com.epms.backend.controller;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.faq.FaqSupportQuestionDto;
import com.epms.backend.dto.faq.FaqSupportQuestionRequest;
import com.epms.backend.dto.faq.FaqSupportReplyRequest;
import com.epms.backend.entity.User;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.service.FaqSupportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/faq-support")
@RequiredArgsConstructor
public class FaqSupportController {

    private final FaqSupportService faqSupportService;
    private final UserRepository userRepository;

    @PostMapping("/questions")
    public ResponseEntity<ApiResponse<FaqSupportQuestionDto>> submitQuestion(
            @Valid @RequestBody FaqSupportQuestionRequest request) {
        FaqSupportQuestionDto question = faqSupportService.submitQuestion(getCurrentUser(), request);
        return ResponseEntity.ok(new ApiResponse<>(true, "FAQ question submitted", question));
    }

    @GetMapping("/questions/my")
    public ResponseEntity<ApiResponse<Page<FaqSupportQuestionDto>>> getMyQuestions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<FaqSupportQuestionDto> questions = faqSupportService.getMyQuestions(
                getCurrentUser(),
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return ResponseEntity.ok(new ApiResponse<>(true, "FAQ questions fetched", questions));
    }

    @GetMapping("/questions/published")
    public ResponseEntity<ApiResponse<Page<FaqSupportQuestionDto>>> getPublishedQuestions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<FaqSupportQuestionDto> questions = faqSupportService.getPublishedQuestions(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "publishedAt")));
        return ResponseEntity.ok(new ApiResponse<>(true, "Published FAQ questions fetched", questions));
    }

    @GetMapping("/hr/questions")
    public ResponseEntity<ApiResponse<Page<FaqSupportQuestionDto>>> getHrQuestions(
            @RequestParam(defaultValue = "all") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        User user = getCurrentUser();
        faqSupportService.requireHr(user);
        Page<FaqSupportQuestionDto> questions = faqSupportService.getQuestionsForHr(
                status,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return ResponseEntity.ok(new ApiResponse<>(true, "FAQ support questions fetched", questions));
    }

    @PutMapping("/hr/questions/{id}/reply")
    public ResponseEntity<ApiResponse<FaqSupportQuestionDto>> reply(
            @PathVariable Long id,
            @Valid @RequestBody FaqSupportReplyRequest request) {
        FaqSupportQuestionDto question = faqSupportService.reply(getCurrentUser(), id, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "FAQ question answered", question));
    }

    @PutMapping("/hr/questions/{id}/publish")
    public ResponseEntity<ApiResponse<FaqSupportQuestionDto>> publish(@PathVariable Long id) {
        FaqSupportQuestionDto question = faqSupportService.publish(getCurrentUser(), id);
        return ResponseEntity.ok(new ApiResponse<>(true, "FAQ question published", question));
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
}
