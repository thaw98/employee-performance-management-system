package com.epms.backend.dto.movement;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportingHistoryResponseDto {

    private Long id;
    private Long employeeId;
    private Long managerEmployeeId;
    private String managerName;
    private LocalDate effectiveStartDate;
    private LocalDate effectiveEndDate;
    private boolean isCurrent;
    private String reason;
    private String remarks;
}
