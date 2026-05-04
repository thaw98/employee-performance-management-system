package com.epms.backend.service;

import com.epms.backend.audit.AuditActionType;
import com.epms.backend.audit.AuditTargetType;
import com.epms.backend.dto.selfassessmentform.QuestionBankDto;
import com.epms.backend.dto.selfassessmentform.QuestionBankRequest;
import com.epms.backend.entity.Department;
import com.epms.backend.entity.QuestionBank;
import com.epms.backend.repository.QuestionBankRepository;
import com.epms.backend.repository.UserRepository;
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
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<QuestionBankDto> getQuestions(boolean includeInactive, Long userId, Long roleId) {
        BankScope scope = resolveBankScope(userId, roleId);
        List<QuestionBank> questions = includeInactive
                ? questionBankRepository.findByBankScopeOrderByCreatedOnDesc(scope.ownerRoleId(), scope.departmentId())
                : questionBankRepository.findActiveByBankScopeOrderByCreatedOnDesc(scope.ownerRoleId(), scope.departmentId());

        return questions.stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public QuestionBankDto createQuestion(QuestionBankRequest request, Long userId, Long roleId) {
        BankScope scope = resolveBankScope(userId, roleId);
        String questionText = normalizedForStorage(request.questionText());
        ensureUnique(questionText, null, scope);

        QuestionBank question = new QuestionBank();
        question.setQuestionText(questionText);
        question.setActive(true);
        question.setOwnerRoleId(scope.ownerRoleId());
        question.setCreatedBy(userId);
        question.setCreatedByRoleId(roleId);
        question.setDepartment(scope.department());
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
        BankScope scope = resolveBankScope(userId, roleId);
        QuestionBank question = questionBankRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Question bank item not found"));
        ensureQuestionBelongsToScope(question, scope);

        String questionText = normalizedForStorage(request.questionText());
        ensureUnique(questionText, id, scope);

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
        BankScope scope = resolveBankScope(userId, roleId);
        QuestionBank question = questionBankRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Question bank item not found"));
        ensureQuestionBelongsToScope(question, scope);

        question.setActive(isActive);
        question.setUpdatedBy(userId);
        question.setUpdatedOn(Instant.now());

        QuestionBank saved = questionBankRepository.save(question);
        recordStatusChange(saved, userId, roleId);

        return toDto(saved);
    }

    private void ensureUnique(String questionText, Long currentId, BankScope scope) {
        String duplicateKey = normalizeForDuplicateCheck(questionText);
        questionBankRepository.findByNormalizedQuestionTextInScope(duplicateKey, scope.ownerRoleId(), scope.departmentId())
                .filter(existing -> currentId == null || !existing.getId().equals(currentId))
                .ifPresent(existing -> {
                    throw new RuntimeException("A question with this text already exists");
                });
    }

    private void ensureQuestionBelongsToScope(QuestionBank question, BankScope scope) {
        Long questionOwnerRoleId = question.getOwnerRoleId() == null ? 1L : question.getOwnerRoleId();
        Long questionDepartmentId = question.getDepartment() != null ? question.getDepartment().getId() : null;
        if (!questionOwnerRoleId.equals(scope.ownerRoleId()) || !sameId(questionDepartmentId, scope.departmentId())) {
            throw new RuntimeException("Question bank item not found");
        }
    }

    private BankScope resolveBankScope(Long userId, Long roleId) {
        if (Long.valueOf(1L).equals(roleId)) {
            return new BankScope(1L, null, null);
        }
        if (Long.valueOf(2L).equals(roleId)) {
            Department department = userRepository.findByIdWithEmployeeDepartment(userId)
                    .map(user -> user.getEmployee() != null ? user.getEmployee().getDepartment() : null)
                    .filter(dept -> dept.getId() != null)
                    .orElseThrow(() -> new RuntimeException("Department is required to access the question bank"));
            return new BankScope(2L, department.getId(), department);
        }
        throw new RuntimeException("You do not have access to the question bank");
    }

    private boolean sameId(Long first, Long second) {
        return first == null ? second == null : first.equals(second);
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
                question.getOwnerRoleId(),
                question.getCreatedBy(),
                question.getCreatedByRoleId(),
                question.getDepartment() != null ? question.getDepartment().getId() : null,
                question.getDepartment() != null ? question.getDepartment().getName() : null,
                question.getCreatedOn(),
                question.getUpdatedBy(),
                question.getUpdatedOn());
    }

    private record BankScope(Long ownerRoleId, Long departmentId, Department department) {
    }
}
