package com.epms.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KpiHistorySummaryDto {
    private Long employeeId;
    private String employeeName;
    private String staffNo;
    private String managerName;
    private String departmentName;
    private String positionName;
    private Long totalKpis;
    private String period;
    private Instant createdDate;
    private BigDecimal totalScore;
}
