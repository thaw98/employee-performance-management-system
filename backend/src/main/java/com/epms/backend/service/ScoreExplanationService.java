package com.epms.backend.service;

import com.epms.backend.audit.AuditActionType;
import com.epms.backend.audit.AuditTargetType;
import com.epms.backend.dto.score.ScoreExplanationDto;
import com.epms.backend.dto.score.BulkUpdateScoreExplanationRequest;
import com.epms.backend.dto.score.UpdateScoreExplanationRequest;
import com.epms.backend.entity.ScoreExplanation;
import com.epms.backend.entity.ScoreExplanationModule;
import com.epms.backend.repository.ScoreExplanationRepository;
import com.epms.backend.security.UserPrincipal;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ScoreExplanationService {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final ScoreExplanationRepository repository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Map<String, List<ScoreExplanationDto>> getAll() {
        Map<String, List<ScoreExplanationDto>> result = new LinkedHashMap<>();
        for (ScoreExplanationModule module : ScoreExplanationModule.values()) {
            result.put(module.name(), getByModule(module));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<ScoreExplanationDto> getByModule(ScoreExplanationModule module) {
        List<ScoreExplanation> rows = repository.findByModuleOrderBySortOrderAsc(module);
        validateFiveRows(module, rows);
        return rows.stream().map(this::toDto).toList();
    }

    @Transactional
    public List<ScoreExplanationDto> update(Long rowId, UpdateScoreExplanationRequest request, UserPrincipal actor) {
        ScoreExplanation source = repository.findById(rowId)
                .orElseThrow(() -> new IllegalArgumentException("Score explanation row not found"));
        validateRequest(request);

        Set<ScoreExplanationModule> modules = requestedModules(request, source.getModule());
        List<ScoreExplanationDto> changed = new ArrayList<>();
        for (ScoreExplanationModule module : modules) {
            ScoreExplanation row = repository.findByModuleAndSortOrder(module, source.getSortOrder())
                    .orElseThrow(() -> new IllegalStateException("Matching score explanation row not found for " + module));
            String before = toJson(snapshot(row));
            row.setMinScore(request.minScore());
            row.setMaxScore(request.maxScore());
            row.setTitle(request.title().trim());
            row.setDetails(request.details().trim());
            row.setUpdatedAt(Instant.now());
            row.setUpdatedBy(actor.getId());
            row.setUpdatedByRoleId(actor.getRoleId());

            List<ScoreExplanation> moduleRows = new ArrayList<>(repository.findByModuleOrderBySortOrderAsc(module));
            validateCoverage(module, moduleRows);
            ScoreExplanation saved = repository.save(row);
            String after = toJson(snapshot(saved));
            auditService.record(
                    AuditActionType.SCORE_EXPLANATION_UPDATED,
                    AuditTargetType.SCORE_EXPLANATION,
                    saved.getId(),
                    actor.getId(),
                    actor.getRoleId(),
                    "Updated score explanation for " + module.name() + " row " + saved.getSortOrder(),
                    toJson(Map.of("reason", request.reason().trim(), "module", module.name(), "sortOrder", saved.getSortOrder())),
                    before,
                    after);
            changed.add(toDto(saved));
        }
        return changed;
    }

    @Transactional
    public List<ScoreExplanationDto> bulkUpdate(BulkUpdateScoreExplanationRequest request, UserPrincipal actor) {
        if (request == null) throw new IllegalArgumentException("Request is required");
        if (request.bands() == null || request.bands().size() != 5) {
            throw new IllegalArgumentException("Exactly five score bands are required");
        }
        if (isBlank(request.reason())) {
            throw new IllegalArgumentException("Reason is required");
        }

        List<BulkUpdateScoreExplanationRequest.BandUpdate> sortedBands = request.bands().stream()
                .sorted(Comparator.comparing(BulkUpdateScoreExplanationRequest.BandUpdate::sortOrder))
                .toList();

        for (int i = 0; i < sortedBands.size(); i++) {
            var band = sortedBands.get(i);
            if (band.sortOrder() == null || band.sortOrder() < 1 || band.sortOrder() > 5) {
                throw new IllegalArgumentException("Invalid sort order");
            }
            if (band.minScore() == null || band.maxScore() == null) {
                throw new IllegalArgumentException("Min and max scores are required for sort order " + band.sortOrder());
            }
            if (band.minScore() < 0 || band.maxScore() > 100 || band.minScore() > band.maxScore()) {
                throw new IllegalArgumentException("Invalid score range for sort order " + band.sortOrder());
            }
            if (isBlank(band.title()) || isBlank(band.details())) {
                throw new IllegalArgumentException("Title and details are required for sort order " + band.sortOrder());
            }
            if (i == 0) {
                if (band.minScore() != 0) {
                    throw new IllegalArgumentException("Score ranges must cover 0-100 with no gaps or overlaps");
                }
            } else {
                var prev = sortedBands.get(i - 1);
                if (band.minScore() != prev.maxScore() + 1) {
                    throw new IllegalArgumentException("Score ranges must cover 0-100 with no gaps or overlaps");
                }
            }
        }
        if (sortedBands.get(4).maxScore() != 100) {
            throw new IllegalArgumentException("Score ranges must cover 0-100 with no gaps or overlaps");
        }

        Set<ScoreExplanationModule> modules = new LinkedHashSet<>();
        if (request.applyToModules() != null) {
            for (String value : request.applyToModules()) {
                if (!isBlank(value)) modules.add(ScoreExplanationModule.valueOf(value.trim()));
            }
        }
        if (modules.isEmpty()) {
            throw new IllegalArgumentException("At least one module must be selected");
        }

        List<ScoreExplanationDto> changed = new ArrayList<>();
        for (ScoreExplanationModule module : modules) {
            for (var band : sortedBands) {
                ScoreExplanation row = repository.findByModuleAndSortOrder(module, band.sortOrder())
                        .orElseThrow(() -> new IllegalStateException(
                                "Score explanation row not found for " + module + " sort order " + band.sortOrder()));

                String before = toJson(snapshot(row));
                row.setMinScore(band.minScore());
                row.setMaxScore(band.maxScore());
                row.setTitle(band.title().trim());
                row.setDetails(band.details().trim());
                row.setUpdatedAt(Instant.now());
                row.setUpdatedBy(actor.getId());
                row.setUpdatedByRoleId(actor.getRoleId());
                ScoreExplanation saved = repository.save(row);

                String after = toJson(snapshot(saved));
                auditService.record(
                        AuditActionType.SCORE_EXPLANATION_UPDATED,
                        AuditTargetType.SCORE_EXPLANATION,
                        saved.getId(),
                        actor.getId(),
                        actor.getRoleId(),
                        "Bulk updated score explanation for " + module.name() + " row " + saved.getSortOrder(),
                        toJson(Map.of("reason", request.reason().trim(), "module", module.name(), "sortOrder", saved.getSortOrder())),
                        before,
                        after);
                changed.add(toDto(saved));
            }

            List<ScoreExplanation> moduleRows = new ArrayList<>(repository.findByModuleOrderBySortOrderAsc(module));
            validateCoverage(module, moduleRows);
        }
        return changed;
    }

    private void validateRequest(UpdateScoreExplanationRequest request) {
        if (request == null) throw new IllegalArgumentException("Request is required");
        if (request.minScore() == null || request.maxScore() == null) {
            throw new IllegalArgumentException("Minimum and maximum scores are required");
        }
        if (request.minScore() < 0 || request.minScore() > 100 || request.maxScore() < 0 || request.maxScore() > 100) {
            throw new IllegalArgumentException("Scores must be between 0 and 100");
        }
        if (request.minScore() > request.maxScore()) {
            throw new IllegalArgumentException("Minimum score cannot exceed maximum score");
        }
        if (isBlank(request.title()) || isBlank(request.details()) || isBlank(request.reason())) {
            throw new IllegalArgumentException("Title, details, and reason are required");
        }
    }

    private Set<ScoreExplanationModule> requestedModules(UpdateScoreExplanationRequest request, ScoreExplanationModule fallback) {
        Set<ScoreExplanationModule> modules = new LinkedHashSet<>();
        if (request.applyToModules() != null) {
            for (String value : request.applyToModules()) {
                if (!isBlank(value)) modules.add(ScoreExplanationModule.valueOf(value.trim()));
            }
        }
        if (modules.isEmpty()) modules.add(fallback);
        return modules;
    }

    private void validateFiveRows(ScoreExplanationModule module, List<ScoreExplanation> rows) {
        if (rows.size() != 5) {
            throw new IllegalStateException("Exactly five score explanation rows are required for " + module.name());
        }
        validateCoverage(module, rows);
    }

    private void validateCoverage(ScoreExplanationModule module, List<ScoreExplanation> rows) {
        List<ScoreExplanation> sorted = rows.stream()
                .sorted(Comparator.comparing(ScoreExplanation::getMinScore))
                .toList();
        int expected = 0;
        for (ScoreExplanation row : sorted) {
            if (row.getMinScore() == null || row.getMaxScore() == null
                    || row.getMinScore() < 0 || row.getMaxScore() > 100 || row.getMinScore() > row.getMaxScore()) {
                throw new IllegalArgumentException("Invalid score range for " + module.name());
            }
            if (row.getMinScore() != expected) {
                throw new IllegalArgumentException("Score ranges for " + module.name() + " must cover 0-100 with no gaps or overlaps");
            }
            expected = row.getMaxScore() + 1;
        }
        if (expected != 101) {
            throw new IllegalArgumentException("Score ranges for " + module.name() + " must cover 0-100 with no gaps or overlaps");
        }
    }

    private ScoreExplanationDto toDto(ScoreExplanation row) {
        return new ScoreExplanationDto(row.getId(), row.getModule().name(), row.getSortOrder(), row.getMinScore(),
                row.getMaxScore(), row.getTitle(), row.getDetails(), row.getCreatedAt(), row.getUpdatedAt(),
                row.getUpdatedBy(), row.getUpdatedByRoleId());
    }

    private Map<String, Object> snapshot(ScoreExplanation row) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", row.getId());
        data.put("module", row.getModule().name());
        data.put("sortOrder", row.getSortOrder());
        data.put("minScore", row.getMinScore());
        data.put("maxScore", row.getMaxScore());
        data.put("title", row.getTitle());
        data.put("details", row.getDetails());
        return data;
    }

    private String toJson(Object value) {
        try {
            return OBJECT_MAPPER.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize score explanation audit data", e);
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
