package com.epms.backend.dto.selfassessmentform;

public record SelfAssessmentAssignmentResponse(
        int createdCount,
        int skippedExistingCount,
        int skippedNoTemplateCount,
        int skippedIneligibleCount,
        CycleInfoDto activeCycle
) {
}
