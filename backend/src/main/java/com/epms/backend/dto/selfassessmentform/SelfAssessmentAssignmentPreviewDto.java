package com.epms.backend.dto.selfassessmentform;

public record SelfAssessmentAssignmentPreviewDto(
        Long departmentId,
        String departmentName,
        Long positionId,
        String positionName,
        Long templateId,
        String templateTitle,
        String ratingSystem,
        int questionCount,
        String assignmentStatus,
        long assignedCount
) {
}
