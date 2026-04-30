package com.epms.backend.dto.selfassessmentform;

import java.time.Instant;

public record FormListDto(
        Long id,
        EmployeeInfoDto employee,
        String status,
        Double totalScore,
        String ratingCategory,
        Instant submittedDate,
        Instant createdDate
) {}