package com.epms.backend.dto.appraisal;

import java.util.List;

public record AppraisalCoverageDto(
        Long reviewCycleId,
        String reviewCycleName,
        int totalEligiblePairs,
        int coveredPairs,
        int missingPairsCount,
        double coveragePercent,
        List<MissingPairDto> missingPairs
) {
    public record MissingPairDto(
            Long departmentPositionId,
            Long departmentId,
            String departmentName,
            Long positionId,
            String positionCode,
            String positionName,
            String levelCodeName,
            int eligibleEmployeeCount
    ) {}
}
