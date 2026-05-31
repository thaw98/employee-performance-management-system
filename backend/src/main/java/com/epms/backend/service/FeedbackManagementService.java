package com.epms.backend.service;

import com.epms.backend.dto.feedbackmanagement.FeedbackLimitConfigDto;
import com.epms.backend.dto.feedbackmanagement.FeedbackTemplateConfigDto;
import com.epms.backend.entity.FeedbackLimitConfig;
import com.epms.backend.entity.FeedbackTemplateConfig;
import com.epms.backend.entity.ReviewCycle;
import com.epms.backend.repository.FeedbackLimitConfigRepository;
import com.epms.backend.repository.FeedbackTemplateConfigRepository;
import com.epms.backend.repository.ReviewCycleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedbackManagementService {
    private final FeedbackTemplateConfigRepository templateRepository;
    private final FeedbackLimitConfigRepository limitRepository;
    private final ReviewCycleRepository reviewCycleRepository;

    public List<FeedbackTemplateConfigDto> getTemplates(Long reviewCycleId) {
        boolean activeCycle = isActiveCycle(reviewCycleId);
        return (reviewCycleId == null
                ? templateRepository.findAll()
                : activeCycle ? templateRepository.findByReviewCycleIdOrReviewCycleIdIsNull(reviewCycleId) : templateRepository.findByReviewCycleId(reviewCycleId))
                .stream().map(this::toTemplateDto).toList();
    }

    @Transactional
    public FeedbackTemplateConfigDto saveTemplate(Long id, FeedbackTemplateConfigDto request) {
        validateTemplate(request);
        ReviewCycle cycle = resolveEditableFutureCycle(request.getReviewCycleId());
        FeedbackTemplateConfig entity = id == null
                ? new FeedbackTemplateConfig()
                : templateRepository.findById(id).orElseThrow(() -> new RuntimeException("Feedback template not found"));
        if (id != null && isLockedStoredCycle(entity.getReviewCycleId())) {
            throw new RuntimeException("This configuration is already active for the current review cycle and cannot be changed. Any updates will apply only to future review cycles.");
        }
        if (entity.getCreatedDate() == null) {
            entity.setCreatedDate(Instant.now());
        }
        entity.setTemplateName(request.getTemplateName().trim());
        entity.setTargetType(normalizeTargetType(request.getTargetType()));
        entity.setTargetId(request.getTargetId());
        entity.setTargetName(request.getTargetName() == null ? "" : request.getTargetName().trim());
        entity.setReviewCycleId(cycle.getId());
        entity.setReviewCycleName(cycle.getName());
        entity.setQuestionIds(toQuestionIdString(request.getQuestionIds()));
        entity.setStatus(normalizeStatus(request.getStatus()));
        entity.setUpdatedDate(Instant.now());
        return toTemplateDto(templateRepository.save(entity));
    }

    @Transactional
    public void deleteTemplate(Long id) {
        FeedbackTemplateConfig entity = templateRepository.findById(id).orElseThrow(() -> new RuntimeException("Feedback template not found"));
        if (isLockedStoredCycle(entity.getReviewCycleId())) {
            throw new RuntimeException("This configuration is already active for the current review cycle and cannot be changed. Any updates will apply only to future review cycles.");
        }
        templateRepository.deleteById(id);
    }

    public List<FeedbackLimitConfigDto> getLimits(Long reviewCycleId) {
        boolean activeCycle = isActiveCycle(reviewCycleId);
        return (reviewCycleId == null
                ? limitRepository.findAll()
                : activeCycle ? limitRepository.findByReviewCycleIdOrReviewCycleIdIsNull(reviewCycleId) : limitRepository.findByReviewCycleId(reviewCycleId))
                .stream().map(this::toLimitDto).toList();
    }

    @Transactional
    public FeedbackLimitConfigDto saveLimit(Long id, FeedbackLimitConfigDto request) {
        validateLimit(request);
        ReviewCycle cycle = resolveEditableFutureCycle(request.getReviewCycleId());
        String relationshipType = normalizeRelationshipType(request.getRelationshipType());
        FeedbackLimitConfig entity = id != null
                ? limitRepository.findById(id).orElseThrow(() -> new RuntimeException("Feedback limit not found"))
                : limitRepository.findByReviewCycleIdAndRelationshipType(cycle.getId(), relationshipType).orElseGet(FeedbackLimitConfig::new);
        if (entity.getId() != null && isLockedStoredCycle(entity.getReviewCycleId())) {
            throw new RuntimeException("This configuration is already active for the current review cycle and cannot be changed. Any updates will apply only to future review cycles.");
        }
        if (entity.getCreatedDate() == null) {
            entity.setCreatedDate(Instant.now());
        }
        entity.setRelationshipType(relationshipType);
        entity.setReviewCycleId(cycle.getId());
        entity.setReviewCycleName(cycle.getName());
        entity.setMinimumCount(request.getMinimumCount());
        entity.setMaximumCount(request.getMaximumCount());
        entity.setUpdatedDate(Instant.now());
        return toLimitDto(limitRepository.save(entity));
    }

    @Transactional
    public void deleteLimit(Long id) {
        FeedbackLimitConfig entity = limitRepository.findById(id).orElseThrow(() -> new RuntimeException("Feedback limit not found"));
        if (isLockedStoredCycle(entity.getReviewCycleId())) {
            throw new RuntimeException("This configuration is already active for the current review cycle and cannot be changed. Any updates will apply only to future review cycles.");
        }
        limitRepository.deleteById(id);
    }

    private void validateTemplate(FeedbackTemplateConfigDto request) {
        if (request == null || request.getTemplateName() == null || request.getTemplateName().trim().isEmpty()) {
            throw new RuntimeException("Template name is required");
        }
        normalizeTargetType(request.getTargetType());
        if (request.getTargetId() == null) {
            throw new RuntimeException("Template target is required");
        }
        if (request.getQuestionIds() == null || request.getQuestionIds().isEmpty()) {
            throw new RuntimeException("At least one question is required");
        }
        if (request.getReviewCycleId() == null) {
            throw new RuntimeException("Review cycle is required");
        }
    }

    private void validateLimit(FeedbackLimitConfigDto request) {
        if (request == null) {
            throw new RuntimeException("Feedback limit details are required");
        }
        normalizeRelationshipType(request.getRelationshipType());
        if (request.getMinimumCount() == null || request.getMaximumCount() == null) {
            throw new RuntimeException("Minimum and maximum counts are required");
        }
        if (request.getMinimumCount() < 0 || request.getMaximumCount() < 0) {
            throw new RuntimeException("Feedback counts cannot be negative");
        }
        if (request.getMinimumCount() > request.getMaximumCount()) {
            throw new RuntimeException("Minimum count cannot be greater than maximum count");
        }
        if (request.getReviewCycleId() == null) {
            throw new RuntimeException("Review cycle is required");
        }
    }

    private ReviewCycle resolveEditableFutureCycle(Long reviewCycleId) {
        ReviewCycle cycle = reviewCycleRepository.findById(reviewCycleId)
                .orElseThrow(() -> new RuntimeException("Review cycle not found"));
        String status = statusOf(cycle);
        if ("ACTIVE".equals(status)) {
            throw new RuntimeException("This configuration is already active for the current review cycle and cannot be changed. Any updates will apply only to future review cycles.");
        }
        if ("CLOSED".equals(status)) {
            throw new RuntimeException("Closed review cycle configurations cannot be changed");
        }
        return cycle;
    }

    private boolean isActiveCycle(Long reviewCycleId) {
        return reviewCycleId != null
                && reviewCycleRepository.findById(reviewCycleId)
                        .map(cycle -> "ACTIVE".equals(statusOf(cycle)))
                        .orElse(false);
    }

    private boolean isLockedStoredCycle(Long reviewCycleId) {
        return reviewCycleId == null || isActiveCycle(reviewCycleId);
    }

    private String statusOf(ReviewCycle cycle) {
        LocalDate today = LocalDate.now();
        if (today.isBefore(cycle.getStartDate())) {
            return "UPCOMING";
        }
        if (today.isAfter(cycle.getEndDate())) {
            return "CLOSED";
        }
        return "ACTIVE";
    }

    private String normalizeTargetType(String value) {
        String normalized = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        if (!List.of("DEPARTMENT", "LEVEL_CODE", "PERSON").contains(normalized)) {
            throw new RuntimeException("Target type must be DEPARTMENT, LEVEL_CODE, or PERSON");
        }
        return normalized;
    }

    private String normalizeRelationshipType(String value) {
        String normalized = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        if (!List.of("MANAGER", "PEER", "SUBORDINATE").contains(normalized)) {
            throw new RuntimeException("Relationship type must be MANAGER, PEER, or SUBORDINATE");
        }
        return normalized;
    }

    private String normalizeStatus(String value) {
        String normalized = value == null ? "ACTIVE" : value.trim().toUpperCase(Locale.ROOT);
        return "INACTIVE".equals(normalized) ? "INACTIVE" : "ACTIVE";
    }

    private String toQuestionIdString(List<Long> questionIds) {
        return questionIds.stream()
                .filter(id -> id != null && id > 0)
                .distinct()
                .map(String::valueOf)
                .collect(Collectors.joining(","));
    }

    private List<Long> parseQuestionIds(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(part -> !part.isEmpty())
                .map(Long::valueOf)
                .toList();
    }

    private FeedbackTemplateConfigDto toTemplateDto(FeedbackTemplateConfig entity) {
        FeedbackTemplateConfigDto dto = new FeedbackTemplateConfigDto();
        dto.setId(entity.getId());
        dto.setTemplateName(entity.getTemplateName());
        dto.setTargetType(entity.getTargetType());
        dto.setTargetId(entity.getTargetId());
        dto.setTargetName(entity.getTargetName());
        dto.setReviewCycleId(entity.getReviewCycleId());
        dto.setReviewCycleName(entity.getReviewCycleName());
        dto.setQuestionIds(parseQuestionIds(entity.getQuestionIds()));
        dto.setStatus(entity.getStatus());
        dto.setCreatedDate(entity.getCreatedDate());
        dto.setUpdatedDate(entity.getUpdatedDate());
        return dto;
    }

    private FeedbackLimitConfigDto toLimitDto(FeedbackLimitConfig entity) {
        FeedbackLimitConfigDto dto = new FeedbackLimitConfigDto();
        dto.setId(entity.getId());
        dto.setRelationshipType(entity.getRelationshipType());
        dto.setReviewCycleId(entity.getReviewCycleId());
        dto.setReviewCycleName(entity.getReviewCycleName());
        dto.setMinimumCount(entity.getMinimumCount());
        dto.setMaximumCount(entity.getMaximumCount());
        dto.setCreatedDate(entity.getCreatedDate());
        dto.setUpdatedDate(entity.getUpdatedDate());
        return dto;
    }
}
