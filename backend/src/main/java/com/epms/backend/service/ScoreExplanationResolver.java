package com.epms.backend.service;

import com.epms.backend.entity.ScoreExplanation;
import com.epms.backend.entity.ScoreExplanationModule;
import com.epms.backend.repository.ScoreExplanationRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ScoreExplanationResolver {
    private final ScoreExplanationRepository repository;

    @Transactional(readOnly = true)
    public String resolveTitle(ScoreExplanationModule module, Double score, String fallback) {
        if (score == null || !Double.isFinite(score)) {
            return fallback;
        }
        int rounded = (int) Math.floor(Math.max(0, Math.min(100, score)));
        return repository.findByModuleOrderBySortOrderAsc(module).stream()
                .filter(row -> rounded >= row.getMinScore() && rounded <= row.getMaxScore())
                .findFirst()
                .map(ScoreExplanation::getTitle)
                .orElseGet(() -> fallback != null && !fallback.isBlank() ? fallback : defaultTitle(rounded));
    }

    @Transactional(readOnly = true)
    public List<ScoreExplanation> rows(ScoreExplanationModule module) {
        return repository.findByModuleOrderBySortOrderAsc(module);
    }

    public static String defaultTitle(double score) {
        if (score >= 86) return "Outstanding";
        if (score >= 71) return "Good";
        if (score >= 60) return "Meet Requirement";
        if (score >= 40) return "Need Improvement";
        return "Unsatisfactory";
    }
}
