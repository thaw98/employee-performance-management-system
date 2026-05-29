package com.epms.backend.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.dto.hr.AppraisalImportCommitRequestDto;
import com.epms.backend.dto.hr.AppraisalImportCommitResponseDto;
import com.epms.backend.entity.AppraisalCategory;
import com.epms.backend.entity.AppraisalImportSession;
import com.epms.backend.entity.AppraisalImportSessionItem;
import com.epms.backend.entity.AppraisalQuestion;
import com.epms.backend.repository.AppraisalCategoryRepository;
import com.epms.backend.repository.AppraisalImportSessionItemRepository;
import com.epms.backend.repository.AppraisalImportSessionRepository;
import com.epms.backend.repository.AppraisalQuestionRepository;
import com.epms.backend.security.UserPrincipal;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

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

    private final ObjectMapper objectMapper = buildObjectMapper();

    private static ObjectMapper buildObjectMapper() {
        ObjectMapper om = new ObjectMapper();
        om.registerModule(new JavaTimeModule());
        om.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return om;
    }

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

        List<AppraisalImportSessionItem> validItems = itemRepository
                .findBySessionIdAndStatusOrderByRowNumber(session.getId(), "VALID");

        int createdCategoryCount = 0;
        int reusedCategoryCount = 0;
        int createdQuestionCount = 0;
        int reusedQuestionCount = 0;
        int failedCount = 0;

        // Cache: categoryName (lowercase) -> AppraisalCategory
        Map<String, AppraisalCategory> categoryCache = new HashMap<>();

        // Sort order counters per category
        Map<String, Integer> categorySortOrder = new HashMap<>();
        Map<String, Integer> questionSortOrder = new HashMap<>();

        // Preload existing categories for reuse
        Map<String, AppraisalCategory> existingCategoryMap = new HashMap<>();
        categoryRepository.findAll().forEach(c ->
                existingCategoryMap.put(c.getName().trim().toLowerCase(), c));

        for (AppraisalImportSessionItem item : validItems) {
            try {
                Map<String, Object> rowData = objectMapper.readValue(item.getRowDataJson(),
                        new TypeReference<Map<String, Object>>() {});

                String categoryName = strOrEmpty(rowData, "categoryName").trim();
                String categoryDescription = strOrEmpty(rowData, "categoryDescription").trim();
                String questionText = strOrEmpty(rowData, "questionText").trim();

                if (categoryName.isEmpty() || questionText.isEmpty()) {
                    throw new IllegalArgumentException("Category Name and Question Text are required");
                }

                // Resolve or create category
                String catKey = categoryName.toLowerCase();
                AppraisalCategory category = categoryCache.get(catKey);
                if (category == null) {
                    Optional<AppraisalCategory> existing = categoryRepository.findByNameIgnoreCase(categoryName);
                    if (existing.isPresent()) {
                        category = existing.get();
                        reusedCategoryCount++;
                    } else {
                        // Check if exists in existingCategoryMap
                        if (existingCategoryMap.containsKey(catKey)) {
                            category = existingCategoryMap.get(catKey);
                            reusedCategoryCount++;
                        } else {
                            category = new AppraisalCategory();
                            category.setName(categoryName);
                            category.setDescription(categoryDescription);
                            category.setStatus(true);
                            category.setSortOrder(categorySortOrder.computeIfAbsent(catKey,
                                    k -> categoryRepository.findAll().size() + 1));
                            category = categoryRepository.save(category);
                            createdCategoryCount++;
                        }
                    }
                    categoryCache.put(catKey, category);
                    existingCategoryMap.put(catKey, category);
                }

                // Check for duplicate question in this category
                Optional<AppraisalQuestion> existingQuestion =
                        questionRepository.findByCategoryIdAndQuestionTextIgnoreCase(
                                category.getId(), questionText);
                if (existingQuestion.isPresent()) {
                    reusedQuestionCount++;
                    item.setStatus("IMPORTED");
                    itemRepository.save(item);
                    continue;
                }

                // Create question
                AppraisalQuestion question = new AppraisalQuestion();
                question.setCategory(category);
                question.setQuestionText(questionText);
                question.setAnswerType("TEXT");
                question.setIsRequired(true);
                final Long catId = category.getId();
                question.setSortOrder(questionSortOrder.computeIfAbsent(
                        catKey + "|" + questionText.toLowerCase(),
                        k -> questionRepository.findByCategoryIdOrderBySortOrderAsc(catId).size() + 1));
                question.setStatus(true);
                questionRepository.save(question);
                createdQuestionCount++;

                item.setStatus("IMPORTED");
                itemRepository.save(item);
            } catch (Exception e) {
                log.error("Failed to import row {}: {}", item.getRowNumber(), e.getMessage(), e);
                item.setStatus("FAILED");
                try {
                    item.setErrorMessagesJson("[\"" + e.getMessage().replace("\"", "'") + "\"]");
                } catch (Exception ignored) {}
                itemRepository.save(item);
                failedCount++;
            }
        }

        session.setCommitted(true);
        session.setCommittedAt(Instant.now());
        sessionRepository.save(session);

        String summaryMsg = String.format(
                "%d categories created, %d reused, %d questions created, %d reused, %d failed",
                createdCategoryCount, reusedCategoryCount, createdQuestionCount, reusedQuestionCount, failedCount);
        return new AppraisalImportCommitResponseDto(true, summaryMsg,
                createdCategoryCount, reusedCategoryCount,
                createdQuestionCount, reusedQuestionCount, failedCount);
    }

    private String strOrEmpty(Map<String, Object> map, String key) {
        Object v = map == null ? null : map.get(key);
        return v == null ? "" : v.toString();
    }
}
