package com.epms.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceReportTransferLogDto {

    private Long id;
    private String transferType;
    private String fromDepartmentName;
    private String toDepartmentName;
    private String fromPositionName;
    private String toPositionName;
    private String effectiveStartDate;
    private String effectiveEndDate;
    private boolean current;
    private String reason;
    private String remarks;
}
