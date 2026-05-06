package com.epms.backend.dto.selfassessmentform;

public record TemplateActiveCheckResultDto(
        Long departmentId,
        Long positionId,
        Long templateId,
        String templateTitle,
        String departmentName,
        String positionName,
        Long reviewCycleId,
        String reviewCycleName
) {}
