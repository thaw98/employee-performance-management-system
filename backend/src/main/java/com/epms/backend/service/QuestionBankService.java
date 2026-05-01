package com.epms.backend.service;

import com.epms.backend.audit.AuditActionType;
import com.epms.backend.audit.AuditTargetType;
import com.epms.backend.dto.selfassessmentform.QuestionBankDto;
import com.epms.backend.dto.selfassessmentform.QuestionBankRequest;
import com.epms.backend.entity.QuestionBank;
import com.epms.backend.repository.QuestionBankRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class QuestionBankService {

    private final QuestionBankRepository questionBankRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<QuestionBankDto> getQuestions(boolean includeInactive) {
        List<QuestionBank> questions = includeInactive
                ? questionBankRepository.findAllByOrderByCreatedOnDesc()
                : questionBankRepository.findByIsActiveTrueOrderByCreatedOnDesc();

        return questions.stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public QuestionBankDto createQuestion(QuestionBankRequest request, Long userId, Long roleId) {
        String questionText = normalizedForStorage(request.questionText());
        ensureUnique(questionText, null);

        QuestionBank question = new QuestionBank();
        question.setQuestionText(questionText);
        question.setActive(true);
        question.setCreatedBy(userId);
        question.setCreatedOn(Instant.now());

        QuestionBank saved = questionBankRepository.save(question);

        auditService.record(
                AuditActionType.QUESTION_BANK_CREATED,
                AuditTargetType.QUESTION_BANK,
                saved.getId(),
                userId,
                roleId,
                "Created question bank item",
                null);

        return toDto(saved);
    }

    @Transactional
    public QuestionBankDto updateQuestion(Long id, QuestionBankRequest request, Long userId, Long roleId) {
        QuestionBank question = questionBankRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Question bank item not found"));

        String questionText = normalizedForStorage(request.questionText());
        ensureUnique(questionText, id);

        boolean statusChanged = question.isActive() != request.isActive();
        question.setQuestionText(questionText);
        question.setActive(request.isActive());
        question.setUpdatedBy(userId);
        question.setUpdatedOn(Instant.now());

        QuestionBank saved = questionBankRepository.save(question);

        auditService.record(
                AuditActionType.QUESTION_BANK_UPDATED,
                AuditTargetType.QUESTION_BANK,
                saved.getId(),
                userId,
                roleId,
                "Updated question bank item",
                null);

        if (statusChanged) {
            recordStatusChange(saved, userId, roleId);
        }

        return toDto(saved);
    }

    @Transactional
    public QuestionBankDto updateStatus(Long id, boolean isActive, Long userId, Long roleId) {
        QuestionBank question = questionBankRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Question bank item not found"));

        question.setActive(isActive);
        question.setUpdatedBy(userId);
        question.setUpdatedOn(Instant.now());

        QuestionBank saved = questionBankRepository.save(question);
        recordStatusChange(saved, userId, roleId);

        return toDto(saved);
    }

    private void ensureUnique(String questionText, Long currentId) {
        String duplicateKey = normalizeForDuplicateCheck(questionText);
        questionBankRepository.findByNormalizedQuestionText(duplicateKey)
                .filter(existing -> currentId == null || !existing.getId().equals(currentId))
                .ifPresent(existing -> {
                    throw new RuntimeException("A question with this text already exists");
                });
    }

    private String normalizedForStorage(String questionText) {
        String value = questionText == null ? "" : questionText.trim();
        if (value.isBlank()) {
            throw new RuntimeException("Question text is required");
        }
        return value;
    }

    private String normalizeForDuplicateCheck(String questionText) {
        return normalizedForStorage(questionText).toLowerCase(Locale.ROOT);
    }

    private void recordStatusChange(QuestionBank question, Long userId, Long roleId) {
        auditService.record(
                AuditActionType.QUESTION_BANK_STATUS_CHANGED,
                AuditTargetType.QUESTION_BANK,
                question.getId(),
                userId,
                roleId,
                question.isActive() ? "Reactivated question bank item" : "Deactivated question bank item",
                null);
    }

    private QuestionBankDto toDto(QuestionBank question) {
        return new QuestionBankDto(
                question.getId(),
                question.getQuestionText(),
                question.isActive(),
                question.getCreatedBy(),
                question.getCreatedOn(),
                question.getUpdatedBy(),
                question.getUpdatedOn());
    }
}
