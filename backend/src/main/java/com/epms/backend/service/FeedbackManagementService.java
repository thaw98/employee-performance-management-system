package com.epms.backend.service;

import com.epms.backend.dto.feedbackmanagement.FeedbackLimitConfigDto;
import com.epms.backend.dto.feedbackmanagement.FeedbackTemplateConfigDto;
import com.epms.backend.dto.feedbackmanagement.FeedbackTemplateConfigDto.AudienceRuleDto;
import com.epms.backend.dto.feedbackmanagement.FormConfigResponse;
import com.epms.backend.entity.Criteria;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.FeedbackLimitConfig;
import com.epms.backend.entity.FeedbackTemplateConfig;
import com.epms.backend.entity.ReviewCycle;
import com.epms.backend.repository.CriteriaRepository;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.FeedbackLimitConfigRepository;
import com.epms.backend.repository.FeedbackTemplateConfigRepository;
import com.epms.backend.repository.ReviewCycleRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedbackManagementService {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final FeedbackTemplateConfigRepository templateRepository;
    private final FeedbackLimitConfigRepository limitRepository;
    private final ReviewCycleRepository reviewCycleRepository;
    private final CriteriaRepository criteriaRepository;
    private final EmployeeRepository employeeRepository;

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
        String targetType = normalizeTargetType(request.getTargetType());
        entity.setTemplateName(request.getTemplateName().trim());
        entity.setTargetType(targetType);
        entity.setTargetId("HYBRID".equals(targetType) ? 0L : request.getTargetId());
        entity.setTargetName(request.getTargetName() == null ? "" : request.getTargetName().trim());
        entity.setReviewCycleId(cycle.getId());
        entity.setReviewCycleName(cycle.getName());
        entity.setQuestionIds(toQuestionIdString(request.getQuestionIds()));
        entity.setStatus(normalizeStatus(request.getStatus()));
        entity.setAudienceRulesJson(serializeAudienceRules(request.getAudienceRules()));
        entity.setMaxRating(request.getMaxRating() != null ? request.getMaxRating() : 5);
        entity.setUpdatedDate(Instant.now());

        List<String> roles = request.getActiveRoles() != null && !request.getActiveRoles().isEmpty()
                ? request.getActiveRoles()
                : List.of("SELF", "PEER", "MANAGER", "SUBORDINATE");
        entity.setActiveRoles(String.join(",", roles));
        entity.setRoleQuestionIds(serializeQuestionsByRole(request.getQuestionsByRole()));

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
        String targetType = normalizeTargetType(request.getTargetType());
        if ("HYBRID".equals(targetType)) {
            if (request.getAudienceRules() == null || request.getAudienceRules().isEmpty()) {
                throw new RuntimeException("At least one audience rule is required for Hybrid target");
            }
            boolean allValid = request.getAudienceRules().stream()
                    .allMatch(rule -> rule.getDepartmentId() != null && rule.getDepartmentId() > 0);
            if (!allValid) {
                throw new RuntimeException("Each Hybrid audience rule must have a department selected");
            }
        } else {
            if (request.getTargetId() == null) {
                throw new RuntimeException("Template target is required");
            }
        }
        if (request.getReviewCycleId() == null) {
            throw new RuntimeException("Review cycle is required");
        }
        Integer maxRating = request.getMaxRating();
        if (maxRating == null || maxRating < 2 || maxRating > 10) {
            throw new RuntimeException("Rating scale must be between 2 and 10");
        }

        List<String> activeRoles = request.getActiveRoles();
        if (activeRoles == null || activeRoles.isEmpty()) {
            throw new RuntimeException("At least one feedback role must be selected");
        }
        Map<String, List<Long>> questionsByRole = request.getQuestionsByRole();
        Set<String> validRoles = Set.of("SELF", "PEER", "MANAGER", "SUBORDINATE");
        for (String role : activeRoles) {
            if (!validRoles.contains(role)) {
                throw new RuntimeException("Invalid feedback role: " + role);
            }
            List<Long> roleQuestions = questionsByRole != null ? questionsByRole.get(role) : null;
            if (roleQuestions == null || roleQuestions.isEmpty()) {
                throw new RuntimeException("At least one question is required for " + roleLabel(role));
            }
        }
    }

    private String roleLabel(String role) {
        return switch (role) {
            case "SELF" -> "Self-evaluate";
            case "PEER" -> "Peers";
            case "MANAGER" -> "Manager";
            case "SUBORDINATE" -> "Subordinate";
            default -> role;
        };
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
        if (!List.of("DEPARTMENT", "LEVEL_CODE", "PERSON", "POSITION", "HYBRID").contains(normalized)) {
            throw new RuntimeException("Target type must be DEPARTMENT, LEVEL_CODE, PERSON, POSITION, or HYBRID");
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
        dto.setAudienceRules(deserializeAudienceRules(entity.getAudienceRulesJson()));
        dto.setStatus(entity.getStatus());
        dto.setMaxRating(entity.getMaxRating() != null ? entity.getMaxRating() : 5);
        dto.setCreatedDate(entity.getCreatedDate());
        dto.setUpdatedDate(entity.getUpdatedDate());

        List<String> roles = parseActiveRoles(entity.getActiveRoles());
        dto.setActiveRoles(roles);
        dto.setQuestionsByRole(deserializeQuestionsByRole(entity.getRoleQuestionIds(), entity.getQuestionIds(), roles));

        return dto;
    }

    private List<String> parseActiveRoles(String value) {
        if (value == null || value.isBlank()) {
            return List.of("SELF", "PEER", "MANAGER", "SUBORDINATE");
        }
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    private String serializeQuestionsByRole(Map<String, List<Long>> questionsByRole) {
        if (questionsByRole == null || questionsByRole.isEmpty()) {
            return null;
        }
        try {
            return OBJECT_MAPPER.writeValueAsString(questionsByRole);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize questions by role", e);
        }
    }

    private Map<String, List<Long>> deserializeQuestionsByRole(String json, String globalQuestionIds, List<String> activeRoles) {
        if (json != null && !json.isBlank()) {
            try {
                return OBJECT_MAPPER.readValue(json, new TypeReference<Map<String, List<Long>>>() {});
            } catch (JsonProcessingException e) {
                return buildDefaultQuestionsByRole(globalQuestionIds, activeRoles);
            }
        }
        return buildDefaultQuestionsByRole(globalQuestionIds, activeRoles);
    }

    private Map<String, List<Long>> buildDefaultQuestionsByRole(String globalQuestionIds, List<String> activeRoles) {
        List<Long> ids = parseQuestionIds(globalQuestionIds);
        Map<String, List<Long>> map = new LinkedHashMap<>();
        for (String role : activeRoles) {
            map.put(role, new ArrayList<>(ids));
        }
        return map;
    }

    private List<Long> getRoleQuestions(FeedbackTemplateConfig entity, String role) {
        Map<String, List<Long>> map = deserializeQuestionsByRole(entity.getRoleQuestionIds(), entity.getQuestionIds(), List.of(role));
        return map.getOrDefault(role, parseQuestionIds(entity.getQuestionIds()));
    }

    private String serializeAudienceRules(List<AudienceRuleDto> rules) {
        if (rules == null || rules.isEmpty()) {
            return null;
        }
        List<AudienceRuleDto> deduplicated = rules.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        try {
            return OBJECT_MAPPER.writeValueAsString(deduplicated);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize audience rules", e);
        }
    }

    private List<AudienceRuleDto> deserializeAudienceRules(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return OBJECT_MAPPER.readValue(json, new TypeReference<List<AudienceRuleDto>>() {});
        } catch (JsonProcessingException e) {
            return Collections.emptyList();
        }
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

    public FormConfigResponse getFormConfig(Long evaluateeId, String role) {
        Employee evaluatee = employeeRepository.findById(evaluateeId)
                .orElseThrow(() -> new RuntimeException("Evaluatee not found"));

        List<ReviewCycle> activeCycles = reviewCycleRepository
                .findByStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByRequiresEmployeeSubmissionDescStartDateDesc(
                        LocalDate.now(), LocalDate.now());
        ReviewCycle activeCycle = activeCycles.stream()
                .filter(ReviewCycle::isRequiresEmployeeSubmission)
                .findFirst()
                .orElse(null);

        if (activeCycle == null) {
            List<Criteria> allCriteria = criteriaRepository.findAll().stream()
                    .filter(c -> Boolean.TRUE.equals(c.getActive()))
                    .collect(Collectors.toList());
            return buildFallbackFormConfig(allCriteria);
        }

        List<FeedbackTemplateConfig> templates = templateRepository
                .findByReviewCycleIdOrReviewCycleIdIsNull(activeCycle.getId())
                .stream()
                .filter(t -> "ACTIVE".equals(t.getStatus()))
                .collect(Collectors.toList());

        if (templates.isEmpty()) {
            List<Criteria> allCriteria = criteriaRepository.findAll().stream()
                    .filter(c -> Boolean.TRUE.equals(c.getActive()))
                    .collect(Collectors.toList());
            return buildFallbackFormConfig(allCriteria);
        }

        Long evaluateeDeptId = evaluatee.getDepartment() != null ? evaluatee.getDepartment().getId() : null;
        Long evaluateePosId = evaluatee.getPosition() != null ? evaluatee.getPosition().getId() : null;
        Long evaluateeLevelCodeId = evaluatee.getPosition() != null && evaluatee.getPosition().getLevelCode() != null
                ? evaluatee.getPosition().getLevelCode().getId()
                : null;

        List<MatchedTemplate> scored = new ArrayList<>();

        for (FeedbackTemplateConfig template : templates) {
            String targetType = template.getTargetType();
            int priority = -1;

            if ("PERSON".equals(targetType) && template.getTargetId().equals(evaluatee.getId())) {
                priority = 5;
            } else if ("HYBRID".equals(targetType)) {
                List<AudienceRuleDto> rules = deserializeAudienceRules(template.getAudienceRulesJson());
                if (rules != null && evaluateeDeptId != null) {
                    boolean matches = rules.stream().anyMatch(rule ->
                            rule.getDepartmentId().equals(evaluateeDeptId)
                            && (rule.getPositionId() == null || rule.getPositionId().equals(evaluateePosId)));
                    if (matches) priority = 4;
                }
            } else if ("POSITION".equals(targetType) && evaluateePosId != null
                    && template.getTargetId().equals(evaluateePosId)) {
                priority = 3;
            } else if ("LEVEL_CODE".equals(targetType) && evaluateeLevelCodeId != null
                    && template.getTargetId().equals(evaluateeLevelCodeId)) {
                priority = 2;
            } else if ("DEPARTMENT".equals(targetType) && evaluateeDeptId != null
                    && template.getTargetId().equals(evaluateeDeptId)) {
                priority = 1;
            }

            if (priority >= 0) {
                scored.add(new MatchedTemplate(template, priority));
            }
        }

        scored.sort(Comparator.comparingInt(MatchedTemplate::priority).reversed());

        FeedbackTemplateConfig best = scored.isEmpty() ? null : scored.get(0).template;

        if (best == null) {
            List<Criteria> allCriteria = criteriaRepository.findAll().stream()
                    .filter(c -> Boolean.TRUE.equals(c.getActive()))
                    .collect(Collectors.toList());
            return buildFallbackFormConfig(allCriteria);
        }

        List<String> templateRoles = parseActiveRoles(best.getActiveRoles());
        String normalizedRole = role.toUpperCase(Locale.ROOT).trim();
        if (!templateRoles.contains(normalizedRole)) {
            List<Criteria> allCriteria = criteriaRepository.findAll().stream()
                    .filter(c -> Boolean.TRUE.equals(c.getActive()))
                    .collect(Collectors.toList());
            return buildFallbackFormConfig(allCriteria);
        }

        return buildFormConfigFromTemplate(best, normalizedRole);
    }

    private FormConfigResponse buildFormConfigFromTemplate(FeedbackTemplateConfig template, String role) {
        List<Long> questionIds = getRoleQuestions(template, role);
        List<Criteria> criteriaEntities = criteriaRepository.findAllById(questionIds);
        List<FormConfigResponse.CriteriaDto> criteriaDtos = criteriaEntities.stream()
                .map(c -> FormConfigResponse.CriteriaDto.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .description(c.getDescription())
                        .build())
                .collect(Collectors.toList());
        return FormConfigResponse.builder()
                .templateId(template.getId())
                .templateName(template.getTemplateName())
                .maxRating(template.getMaxRating() != null ? template.getMaxRating() : 5)
                .criteria(criteriaDtos)
                .build();
    }

    private FormConfigResponse buildFallbackFormConfig(List<Criteria> allCriteria) {
        List<FormConfigResponse.CriteriaDto> criteriaDtos = allCriteria.stream()
                .map(c -> FormConfigResponse.CriteriaDto.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .description(c.getDescription())
                        .build())
                .collect(Collectors.toList());
        return FormConfigResponse.builder()
                .templateId(null)
                .templateName("Default (All Active Criteria)")
                .maxRating(5)
                .criteria(criteriaDtos)
                .build();
    }

    private record MatchedTemplate(FeedbackTemplateConfig template, int priority) {}
}
