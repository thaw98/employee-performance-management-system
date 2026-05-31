package com.epms.backend.service;

import com.epms.backend.dto.scoreformula.CreateScoreFormulaRequest;
import com.epms.backend.dto.scoreformula.ScoreFormulaDto;
import com.epms.backend.dto.scoreformula.UpdateScoreFormulaRequest;
import com.epms.backend.entity.ScoreFormula;
import com.epms.backend.entity.ScoreFormulaArea;
import com.epms.backend.repository.ScoreFormulaRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ScoreFormulaService {

    private final ScoreFormulaRepository repository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<ScoreFormulaDto> getFormulasByArea(String area) {
        ScoreFormulaArea formulaArea = ScoreFormulaArea.valueOf(area);
        return repository.findByAreaOrderByCreatedAtDesc(formulaArea).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public ScoreFormulaDto getFormula(Long id) {
        ScoreFormula formula = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Formula not found"));
        return toDto(formula);
    }

    @Transactional
    public ScoreFormulaDto createFormula(CreateScoreFormulaRequest request, Long userId) {
        ScoreFormulaArea area = ScoreFormulaArea.valueOf(request.area());

        ScoreFormula formula = new ScoreFormula();
        formula.setName(request.name());
        formula.setArea(area);
        formula.setActive(true);
        formula.setIsDefault(false);
        formula.setDefinition(request.definition());
        formula.setDescription(request.description());
        formula.setCreatedBy(userId);
        formula.setCreatedAt(Instant.now());

        formula = repository.save(formula);
        return toDto(formula);
    }

    @Transactional
    public ScoreFormulaDto updateFormula(Long id, UpdateScoreFormulaRequest request, Long userId) {
        ScoreFormula formula = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Formula not found"));

        if (request.name() != null) {
            formula.setName(request.name());
        }
        if (request.definition() != null) {
            formula.setDefinition(request.definition());
        }
        if (request.description() != null) {
            formula.setDescription(request.description());
        }
        formula.setUpdatedBy(userId);
        formula.setUpdatedAt(Instant.now());

        formula = repository.save(formula);
        return toDto(formula);
    }

    @Transactional
    public ScoreFormulaDto setDefaultFormula(Long id, Long userId) {
        ScoreFormula formula = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Formula not found"));
        if (!formula.getActive()) {
            throw new RuntimeException("Cannot set an inactive formula as default");
        }

        ScoreFormulaArea area = formula.getArea();

        repository.findByAreaAndIsDefaultTrue(area).ifPresent(existing -> {
            existing.setIsDefault(false);
            existing.setUpdatedBy(userId);
            existing.setUpdatedAt(Instant.now());
            repository.save(existing);
        });

        formula.setIsDefault(true);
        formula.setUpdatedBy(userId);
        formula.setUpdatedAt(Instant.now());

        formula = repository.save(formula);
        return toDto(formula);
    }

    @Transactional
    public ScoreFormulaDto inactivateFormula(Long id, Long replacementId, Long userId) {
        ScoreFormula formula = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Formula not found"));
        if (!formula.getActive()) {
            throw new RuntimeException("Formula is already inactive");
        }

        if (Boolean.TRUE.equals(formula.getIsDefault())) {
            if (replacementId == null) {
                throw new RuntimeException(
                        "Cannot inactivate the default formula. Please select a replacement formula to set as the new default first.");
            }
            ScoreFormula replacement = repository.findById(replacementId)
                    .orElseThrow(() -> new RuntimeException("Replacement formula not found"));
            if (!replacement.getActive()) {
                throw new RuntimeException("Replacement formula must be active");
            }
            if (replacement.getArea() != formula.getArea()) {
                throw new RuntimeException("Replacement formula must be for the same area");
            }

            formula.setIsDefault(false);
            replacement.setIsDefault(true);
            replacement.setUpdatedBy(userId);
            replacement.setUpdatedAt(Instant.now());
            repository.save(replacement);
        }

        formula.setActive(false);
        formula.setUpdatedBy(userId);
        formula.setUpdatedAt(Instant.now());
        formula.setInactivatedBy(userId);
        formula.setInactivatedAt(Instant.now());

        formula = repository.save(formula);
        return toDto(formula);
    }

    public ScoreFormulaDto getActiveDefaultFormula(String area) {
        ScoreFormulaArea formulaArea = ScoreFormulaArea.valueOf(area);
        return repository.findByAreaAndIsDefaultTrueAndActiveTrue(formulaArea)
                .map(this::toDto)
                .orElseThrow(() -> new RuntimeException("No active default formula found for area: " + area));
    }

    public ScoreFormulaDto getActiveDefaultFormula(ScoreFormulaArea area) {
        return repository.findByAreaAndIsDefaultTrueAndActiveTrue(area)
                .map(this::toDto)
                .orElseThrow(() -> new RuntimeException("No active default formula found for area: " + area));
    }

    public double evaluateFormula(ScoreFormulaDto formula, Map<String, Double> inputs) {
        try {
            JsonNode expr = objectMapper.readTree(formula.definition());
            if (expr.has("expression")) {
                expr = expr.get("expression");
            }
            return evaluateNode(expr, inputs);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Invalid formula definition", e);
        }
    }

    public double evaluateFormula(String definitionJson, Map<String, Double> inputs) {
        try {
            JsonNode expr = objectMapper.readTree(definitionJson);
            if (expr.has("expression")) {
                expr = expr.get("expression");
            }
            return evaluateNode(expr, inputs);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Invalid formula definition", e);
        }
    }

    private double evaluateNode(JsonNode node, Map<String, Double> inputs) {
        if (node == null) {
            throw new RuntimeException("Null node in formula expression");
        }
        String type = node.get("type").asText();
        return switch (type) {
            case "literal" -> node.get("value").asDouble();
            case "input" -> {
                String name = node.get("name").asText();
                Double value = inputs.get(name);
                if (value == null) {
                    throw new RuntimeException("Missing input: " + name);
                }
                yield value;
            }
            case "add" -> evaluateNode(node.get("left"), inputs) + evaluateNode(node.get("right"), inputs);
            case "subtract" -> evaluateNode(node.get("left"), inputs) - evaluateNode(node.get("right"), inputs);
            case "multiply" -> evaluateNode(node.get("left"), inputs) * evaluateNode(node.get("right"), inputs);
            case "divide" -> {
                double left = evaluateNode(node.get("left"), inputs);
                double right = evaluateNode(node.get("right"), inputs);
                if (right == 0) {
                    yield 0.0;
                }
                yield left / right;
            }
            default -> throw new RuntimeException("Unknown operation: " + type);
        };
    }

    private ScoreFormulaDto toDto(ScoreFormula f) {
        return new ScoreFormulaDto(
                f.getId(),
                f.getName(),
                f.getArea().name(),
                Boolean.TRUE.equals(f.getActive()),
                Boolean.TRUE.equals(f.getIsDefault()),
                f.getDefinition(),
                f.getDescription(),
                f.getCreatedBy(),
                f.getCreatedAt(),
                f.getUpdatedBy(),
                f.getUpdatedAt(),
                f.getInactivatedBy(),
                f.getInactivatedAt());
    }
}
