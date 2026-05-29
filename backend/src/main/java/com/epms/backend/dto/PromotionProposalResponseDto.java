package com.epms.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromotionProposalResponseDto {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private String staffNo;
    private Long oldPositionId;
    private String oldPositionName;
    private Long targetPositionId;
    private String targetPositionName;
    private String requesterName;
    private Long departmentId;
    private String departmentName;
    private LocalDate effectiveDate;
    private String remarks;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
