package com.epms.backend.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class KpiDto {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private String name;
    private String category;
    private String target;
    private String unit;
    private String actual;
    private BigDecimal weight;
    private BigDecimal score;
    private BigDecimal weightedScore;
    private String period;
    private String status;
}
