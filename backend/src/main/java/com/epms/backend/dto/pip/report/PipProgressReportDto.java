package com.epms.backend.dto.pip.report;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PipProgressReportDto {
    private String departmentName;
    private String positionName;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private Long totalPips;
    private Long activePips;
    private Long completedPips;
    private Long closedPips;
    private Long autoClosedPips;
    private Long reopenRequestedPips;
    private BigDecimal averageProgress;
    private Integer totalPlannedHours;
    private Integer totalCompletedHours;
    private BigDecimal hoursCompletionPercentage;
}
