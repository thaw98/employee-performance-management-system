package com.epms.backend.service;

import com.epms.backend.dto.faq.FaqSupportQuestionDto;
import com.epms.backend.dto.faq.FaqSupportQuestionRequest;
import com.epms.backend.dto.faq.FaqSupportReplyRequest;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.FaqSupportQuestion;
import com.epms.backend.entity.FaqSupportStatus;
import com.epms.backend.entity.User;
import com.epms.backend.repository.FaqSupportQuestionRepository;
import com.epms.backend.repository.UserRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FaqSupportService {

    private static final String SOURCE = "FAQ_SUPPORT";

    private final FaqSupportQuestionRepository faqSupportQuestionRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public FaqSupportQuestionDto submitQuestion(User submitter, FaqSupportQuestionRequest request) {
        FaqSupportQuestion question = new FaqSupportQuestion();
        question.setSubmitter(submitter);
        question.setCategory(normalizeCategory(request.category()));
        question.setSubject(request.subject().trim());
        question.setQuestion(request.question().trim());

        FaqSupportQuestion saved = faqSupportQuestionRepository.save(question);
        notifyHrUsers(saved);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<FaqSupportQuestionDto> getMyQuestions(User user, Pageable pageable) {
        return faqSupportQuestionRepository.findBySubmitter(user, pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public Page<FaqSupportQuestionDto> getPublishedQuestions(Pageable pageable) {
        return faqSupportQuestionRepository.findByPublishedTrue(pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public Page<FaqSupportQuestionDto> getQuestionsForHr(String status, Pageable pageable) {
        FaqSupportStatus normalizedStatus = parseStatus(status);
        Page<FaqSupportQuestion> questions = normalizedStatus == null
                ? faqSupportQuestionRepository.findAll(pageable)
                : faqSupportQuestionRepository.findByStatus(normalizedStatus, pageable);
        return questions.map(this::toDto);
    }

    @Transactional
    public FaqSupportQuestionDto reply(User hrUser, Long id, FaqSupportReplyRequest request) {
        requireHr(hrUser);
        FaqSupportQuestion question = faqSupportQuestionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("FAQ question not found"));
        question.setAnswer(request.answer().trim());
        question.setAnsweredBy(hrUser);
        question.setStatus(FaqSupportStatus.ANSWERED);
        question.setAnsweredAt(LocalDateTime.now());
        question.setUpdatedAt(LocalDateTime.now());

        FaqSupportQuestion saved = faqSupportQuestionRepository.save(question);
        notificationService.send(
                saved.getSubmitter(),
                "HR replied to your FAQ question",
                "Your FAQ question \"" + saved.getSubject() + "\" has been answered.",
                SOURCE,
                saved.getId());
        return toDto(saved);
    }

    @Transactional
    public FaqSupportQuestionDto publish(User hrUser, Long id) {
        requireHr(hrUser);
        FaqSupportQuestion question = faqSupportQuestionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("FAQ question not found"));
        if (question.getStatus() != FaqSupportStatus.ANSWERED || question.getAnswer() == null || question.getAnswer().isBlank()) {
            throw new RuntimeException("Only answered FAQ questions can be published");
        }
        question.setPublished(true);
        question.setPublishedAt(LocalDateTime.now());
        question.setUpdatedAt(LocalDateTime.now());
        return toDto(faqSupportQuestionRepository.save(question));
    }

    public void requireHr(User user) {
        Long roleId = user.getRole() != null ? user.getRole().getId() : null;
        if (!Long.valueOf(1L).equals(roleId)) {
            throw new RuntimeException("Only HR can access FAQ support questions");
        }
    }

    private void notifyHrUsers(FaqSupportQuestion question) {
        userRepository.findByRole_NameIgnoreCase("HR").stream()
                .filter(User::isActive)
                .forEach(hr -> notificationService.send(
                        hr,
                        "New FAQ question",
                        displayName(question.getSubmitter()) + " asked about " + question.getCategory() + ": " + question.getSubject(),
                        SOURCE,
                        question.getId()));
    }

    private String normalizeCategory(String category) {
        String normalized = category == null ? "" : category.trim().toUpperCase();
        return switch (normalized) {
            case "KPI", "PIP", "FEEDBACK", "ASSESSMENT", "APPRAISAL" -> normalized;
            default -> throw new RuntimeException("Category must be KPI, PIP, FEEDBACK, ASSESSMENT, or APPRAISAL");
        };
    }

    private FaqSupportStatus parseStatus(String status) {
        if (status == null || status.isBlank() || "all".equalsIgnoreCase(status)) {
            return null;
        }
        try {
            return FaqSupportStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("status must be all, OPEN, or ANSWERED");
        }
    }

    private FaqSupportQuestionDto toDto(FaqSupportQuestion question) {
        User submitter = question.getSubmitter();
        Employee employee = submitter != null ? submitter.getEmployee() : null;
        User answeredBy = question.getAnsweredBy();

        return new FaqSupportQuestionDto(
                question.getId(),
                submitter != null ? submitter.getId() : null,
                displayName(submitter),
                employee != null ? employee.getEmail() : null,
                employee != null && employee.getDepartment() != null ? employee.getDepartment().getName() : null,
                question.getCategory(),
                question.getSubject(),
                question.getQuestion(),
                question.getAnswer(),
                answeredBy != null ? answeredBy.getId() : null,
                displayName(answeredBy),
                question.getStatus(),
                Boolean.TRUE.equals(question.getPublished()),
                question.getCreatedAt(),
                question.getAnsweredAt(),
                question.getPublishedAt(),
                question.getUpdatedAt());
    }

    private String displayName(User user) {
        if (user == null || user.getEmployee() == null) {
            return "Unknown user";
        }
        return user.getEmployee().getEmployeeName();
    }
}
