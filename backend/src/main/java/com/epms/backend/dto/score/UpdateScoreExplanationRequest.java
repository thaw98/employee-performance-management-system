package com.epms.backend.dto.score;

import java.util.List;

public record UpdateScoreExplanationRequest(
        Integer minScore,
        Integer maxScore,
        String title,
        String details,
        String reason,
        List<String> applyToModules) {
}
