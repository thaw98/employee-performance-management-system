package com.epms.backend.dto.selfassessmentform;

import java.time.LocalDate;

public record SetTemplateDeadlineResponse(
        Long templateId,
        String templateTitle,
        Long departmentId,
        String departmentName,
        Long positionId,
        String positionName,
        String title,
        LocalDate deadlineDate,
        CycleInfoDto activeCycle,
        int createdCount,
        int skippedCount
) {
}
