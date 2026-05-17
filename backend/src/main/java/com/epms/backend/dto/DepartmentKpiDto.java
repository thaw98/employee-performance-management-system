package com.epms.backend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;

@Data
public class DepartmentKpiDto {
    private Long id;
    private Long departmentId;
    private String name;
    private String category;
    private String target;
    private String unit;
    private String actual;
    private BigDecimal weight;
    private BigDecimal score;
    private BigDecimal weightedScore;
    private BigDecimal totalDepartmentScore;
    private String period;
    private String status;
    private String recordStatus;
    private Instant createdDate;
    private Instant updatedDate;
}
