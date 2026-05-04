package com.epms.backend.dto.transfer;

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
public class TransferHistoryResponseDto {

    private Long id;
    private Long employeeId;
    private String transferType;

    private Long fromDepartmentId;
    private String fromDepartmentName;
    private Long toDepartmentId;
    private String toDepartmentName;

    private Long fromPositionId;
    private String fromPositionName;
    private Long toPositionId;
    private String toPositionName;

    private LocalDate effectiveStartDate;
    private LocalDate effectiveEndDate;
    private boolean isCurrent;
    private String reason;
    private String remarks;
}
