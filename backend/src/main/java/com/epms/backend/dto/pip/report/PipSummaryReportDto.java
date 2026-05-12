package com.epms.backend.dto.pip.report;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PipSummaryReportDto {
    private Long pipId;
    private String employeeStaffNo;
    private String employeeName;
    private String departmentName;
    private String positionName;
    private String managerName;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal overallProgress;
    private Integer totalHours;
    private Integer completedHours;
    private Integer objectivesCount;
    private Integer meetingsCount;
    private String finalOutcome;
}
