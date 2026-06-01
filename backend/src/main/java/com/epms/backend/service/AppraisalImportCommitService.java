package com.epms.backend.service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.dto.hr.AppraisalImportCommitRequestDto;
import com.epms.backend.dto.hr.AppraisalImportCommitResponseDto;
import com.epms.backend.dto.hr.AppraisalImportEditedRowDto;
import com.epms.backend.entity.AppraisalCategory;
import com.epms.backend.entity.AppraisalImportSession;
import com.epms.backend.entity.AppraisalImportSessionItem;
import com.epms.backend.entity.AppraisalQuestion;
import com.epms.backend.entity.AppraisalTemplate;
import com.epms.backend.entity.DepartmentPosition;
import com.epms.backend.repository.AppraisalCategoryRepository;
import com.epms.backend.repository.AppraisalImportSessionItemRepository;
import com.epms.backend.repository.AppraisalImportSessionRepository;
import com.epms.backend.repository.AppraisalQuestionRepository;
import com.epms.backend.repository.AppraisalTemplateRepository;
import com.epms.backend.repository.DepartmentPositionRepository;
import com.epms.backend.security.UserPrincipal;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppraisalImportCommitService {

    private final AppraisalImportSessionRepository sessionRepository;
    private final AppraisalImportSessionItemRepository itemRepository;
    private final AppraisalCategoryRepository categoryRepository;
    private final AppraisalQuestionRepository questionRepository;
    private final AppraisalTemplateRepository templateRepository;
    private final DepartmentPositionRepository departmentPositionRepository;

    @Transactional
    public AppraisalImportCommitResponseDto commit(AppraisalImportCommitRequestDto request, UserPrincipal principal) {
        String validationId = request.getValidationId();
        if (validationId == null || validationId.isBlank()) {
            throw new IllegalArgumentException("validationId is required");
        }

        AppraisalImportSession session = sessionRepository.findByValidationId(validationId)
                .orElseThrow(() -> new IllegalArgumentException("Import session not found"));

        if (session.isCommitted()) {
            throw new IllegalStateException("This import session has already been committed");
        }

        // Validate template metadata
        validateTemplateMetadata(request);

        List<AppraisalImportEditedRowDto> editedRows = request.getEditedRows();
        if (editedRows == null || editedRows.isEmpty()) {
            throw new IllegalArgumentException("No edited rows provided");
        }

        int expectedValidCount = session.getValidRows() != null ? session.getValidRows() : 0;
        if (editedRows.size() != expectedValidCount) {
            throw new IllegalArgumentException(
                    "Edited rows count (" + editedRows.size() + ") does not match valid rows count (" + expectedValidCount + ")");
        }

        // Revalidate edited rows
        validateEditedRows(editedRows);

        int createdCategoryCount = 0;
        int reusedCategoryCount = 0;
        int createdQuestionCount = 0;
        int reusedQuestionCount = 0;
        int failedCount = 0;

        // Cache: categoryName (lowercase) -> AppraisalCategory
        Map<String, AppraisalCategory> categoryCache = new HashMap<>();
        Map<String, AppraisalCategory> existingCategoryMap = new HashMap<>();

        // Sort order counters
        Map<String, Integer> categorySortOrder = new HashMap<>();
        Map<String, Integer> questionSortOrder = new HashMap<>();

        // Preload existing categories
        categoryRepository.findAll().forEach(c ->
                existingCategoryMap.put(c.getName().trim().toLowerCase(), c));

        // Track created/reused category IDs for template
        List<AppraisalCategory> categoriesForTemplate = new ArrayList<>();
        Set<Long> addedCategoryIds = new HashSet<>();

        // Load existing valid items to update their status
        List<AppraisalImportSessionItem> validItems = itemRepository
                .findBySessionIdAndStatusOrderByRowNumber(session.getId(), "VALID");

        Map<Integer, AppraisalImportSessionItem> validItemMap = new HashMap<>();
        for (AppraisalImportSessionItem item : validItems) {
            validItemMap.put(item.getRowNumber(), item);
        }

        for (AppraisalImportEditedRowDto editedRow : editedRows) {
            try {
                String categoryName = editedRow.getCategoryName().trim();
                String categoryDescription = editedRow.getCategoryDescription() != null
                        ? editedRow.getCategoryDescription().trim() : "";
                String questionText = editedRow.getQuestionText().trim();

                // Resolve or create category
                String catKey = categoryName.toLowerCase();
                AppraisalCategory category = categoryCache.get(catKey);
                if (category == null) {
                    Optional<AppraisalCategory> existing = categoryRepository.findByNameIgnoreCase(categoryName);
                    if (existing.isPresent()) {
                        category = existing.get();
                        reusedCategoryCount++;
                    } else if (existingCategoryMap.containsKey(catKey)) {
                        category = existingCategoryMap.get(catKey);
                        reusedCategoryCount++;
                    } else {
                        category = new AppraisalCategory();
                        category.setName(categoryName);
                        category.setDescription(categoryDescription);
                        category.setStatus(true);
                        category.setSortOrder(categorySortOrder.computeIfAbsent(catKey,
                                k -> (int) categoryRepository.count() + 1));
                        category.setIsFinalized(false);
                        category = categoryRepository.save(category);
                        createdCategoryCount++;
                    }
                    categoryCache.put(catKey, category);
                    existingCategoryMap.put(catKey, category);
                }

                if (!addedCategoryIds.contains(category.getId())) {
                    categoriesForTemplate.add(category);
                    addedCategoryIds.add(category.getId());
                }

                // Check for duplicate question in this category
                Optional<AppraisalQuestion> existingQuestion =
                        questionRepository.findByCategoryIdAndQuestionTextIgnoreCase(
                                category.getId(), questionText);
                if (existingQuestion.isPresent()) {
                    reusedQuestionCount++;
                    // Mark corresponding session item
                    markItemImported(validItemMap, editedRow.getRowNumber());
                    continue;
                }

                // Create question
                AppraisalQuestion question = new AppraisalQuestion();
                question.setCategory(category);
                question.setQuestionText(questionText);
                question.setAnswerType("TEXT");
                question.setIsRequired(true);
                Long catId = category.getId();
                question.setSortOrder(questionSortOrder.computeIfAbsent(
                        catKey + "|" + questionText.toLowerCase(),
                        k -> questionRepository.findByCategoryIdOrderBySortOrderAsc(catId).size() + 1));
                question.setStatus(true);
                questionRepository.save(question);
                createdQuestionCount++;

                markItemImported(validItemMap, editedRow.getRowNumber());
            } catch (Exception e) {
                log.error("Failed to import edited row {}: {}", editedRow.getRowNumber(), e.getMessage(), e);
                markItemFailed(validItemMap, editedRow.getRowNumber(), e.getMessage());
                failedCount++;
            }
        }

        if (failedCount > 0 && createdCategoryCount == 0 && createdQuestionCount == 0) {
            throw new IllegalStateException("All rows failed to import. No categories or questions were created.");
        }

        // Deactivate previous active templates
        List<AppraisalTemplate> activeTemplates = templateRepository.findAllByIsActiveTrue();
        activeTemplates.forEach(t -> {
            t.setIsActive(false);
            templateRepository.save(t);
        });

        // Create new template
        AppraisalTemplate template = new AppraisalTemplate();
        template.setName(request.getTemplateName());
        template.setAssessmentDate(request.getAssessmentDate());
        template.setEffectiveDate(request.getEffectiveDate());
        template.setDeadlineDate(request.getDeadlineDate());
        template.setReviewCycleId(request.getReviewCycleId());
        template.setMaxRating(request.getMaxRating() != null ? request.getMaxRating() : 5);
        template.setIsActive(true);
        template.setCategories(categoriesForTemplate);

        if (request.getPositionIds() != null && !request.getPositionIds().isEmpty()) {
            List<DepartmentPosition> mappings = departmentPositionRepository.findAllById(request.getPositionIds());
            template.setTargetDepartmentPositions(mappings);
        }

        template = templateRepository.save(template);

        // Mark categories as finalized
        categoriesForTemplate.forEach(c -> {
            c.setIsFinalized(true);
            categoryRepository.save(c);
        });

        // Mark session as committed
        session.setCommitted(true);
        session.setCommittedAt(Instant.now());
        sessionRepository.save(session);

        String summaryMsg = String.format(
                "%d categories created, %d reused, %d questions created, %d reused, %d failed",
                createdCategoryCount, reusedCategoryCount, createdQuestionCount, reusedQuestionCount, failedCount);

        AppraisalImportCommitResponseDto response = new AppraisalImportCommitResponseDto(
                true, summaryMsg,
                createdCategoryCount, reusedCategoryCount,
                createdQuestionCount, reusedQuestionCount, failedCount,
                template.getId(), template.getName());
        return response;
    }

    private void validateTemplateMetadata(AppraisalImportCommitRequestDto request) {
        if (request.getTemplateName() == null || request.getTemplateName().isBlank()) {
            throw new IllegalArgumentException("Template name is required");
        }
        if (request.getAssessmentDate() == null) {
            throw new IllegalArgumentException("Assessment date is required");
        }
        if (request.getEffectiveDate() == null) {
            throw new IllegalArgumentException("Effective date is required");
        }
        if (request.getDeadlineDate() == null) {
            throw new IllegalArgumentException("Deadline date is required");
        }
        if (request.getPositionIds() == null || request.getPositionIds().isEmpty()) {
            throw new IllegalArgumentException("At least one target position must be selected");
        }
        if (request.getMaxRating() == null || request.getMaxRating() < 1 || request.getMaxRating() > 10) {
            throw new IllegalArgumentException("Max rating must be between 1 and 10");
        }
    }

    private void validateEditedRows(List<AppraisalImportEditedRowDto> rows) {
        Set<String> seenPairs = new HashSet<>();
        Set<Integer> seenRowNumbers = new HashSet<>();

        for (AppraisalImportEditedRowDto row : rows) {
            if (row.getRowNumber() == null) {
                throw new IllegalArgumentException("Each edited row must have a row number");
            }
            if (seenRowNumbers.contains(row.getRowNumber())) {
                throw new IllegalArgumentException("Duplicate row number: " + row.getRowNumber());
            }
            seenRowNumbers.add(row.getRowNumber());

            String catName = row.getCategoryName() != null ? row.getCategoryName().trim() : "";
            String questionText = row.getQuestionText() != null ? row.getQuestionText().trim() : "";

            if (catName.isEmpty()) {
                throw new IllegalArgumentException("Row " + row.getRowNumber() + ": Category name cannot be blank");
            }
            if (questionText.isEmpty()) {
                throw new IllegalArgumentException("Row " + row.getRowNumber() + ": Question text cannot be blank");
            }

            String pairKey = catName.toLowerCase() + "||" + questionText.toLowerCase();
            if (seenPairs.contains(pairKey)) {
                throw new IllegalArgumentException(
                        "Duplicate category + question pair at rows containing '" + catName + "' / '" + questionText + "'");
            }
            seenPairs.add(pairKey);
        }
    }

    private void markItemImported(Map<Integer, AppraisalImportSessionItem> validItemMap, Integer rowNumber) {
        if (rowNumber != null && validItemMap.containsKey(rowNumber)) {
            AppraisalImportSessionItem item = validItemMap.get(rowNumber);
            item.setStatus("IMPORTED");
            itemRepository.save(item);
        }
    }

    private void markItemFailed(Map<Integer, AppraisalImportSessionItem> validItemMap, Integer rowNumber, String errorMsg) {
        if (rowNumber != null && validItemMap.containsKey(rowNumber)) {
            AppraisalImportSessionItem item = validItemMap.get(rowNumber);
            item.setStatus("FAILED");
            try {
                item.setErrorMessagesJson("[\"" + errorMsg.replace("\"", "'") + "\"]");
            } catch (Exception ignored) {}
            itemRepository.save(item);
        }
    }
}
