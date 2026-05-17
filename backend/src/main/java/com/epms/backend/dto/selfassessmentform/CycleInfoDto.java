package com.epms.backend.dto.selfassessmentform;

import java.time.LocalDate;

public record CycleInfoDto(
        Long id,
        String name,
        String code,
        LocalDate startDate,
        LocalDate endDate
) {
}
