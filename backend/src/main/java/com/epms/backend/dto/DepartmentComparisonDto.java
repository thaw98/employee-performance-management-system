package com.epms.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentComparisonDto {
    private Long departmentId;
    private String departmentName;
    private Long totalStaff;
    private String managerName;
    private BigDecimal totalScore;
}
