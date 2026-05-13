package com.epms.backend.dto.selfassessmentform;

import java.time.Instant;

public record ScoreRecordDto(
        Long id,
        EmployeeInfoDto employee,
        String status,
        Double finalApprovedScore,
        String performance,
        Long cycleId,
        String cycleName,
        Instant submittedDate,
        Instant createdDate,
        Instant finalApprovalDate
) {}
