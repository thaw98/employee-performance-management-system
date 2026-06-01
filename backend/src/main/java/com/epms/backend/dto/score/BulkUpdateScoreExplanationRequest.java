package com.epms.backend.dto.score;

import java.util.List;

public record BulkUpdateScoreExplanationRequest(
        List<BandUpdate> bands,
        String reason,
        List<String> applyToModules) {

    public record BandUpdate(
            Integer sortOrder,
            Integer minScore,
            Integer maxScore,
            String title,
            String details) {
    }
}
