package com.epms.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;
import java.time.LocalDate;

public record ReviewCycleDto(
        Long id,
        Long timeSettingId,
        Long parentCycleId,
        String name,
        String code,
        String cycleType,
        String yearLabel,
        Integer sequenceNo,
        LocalDate startDate,
        LocalDate endDate,
        boolean requiresEmployeeSubmission,
        String rollupMethod,
        String status,
        @JsonProperty("isActive")
        boolean isActive,
        Instant createdAt,
        Instant updatedAt
) {
}
