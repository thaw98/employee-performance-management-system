package com.epms.backend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;

@Data
public class PositionKpiDto {
    private Long id;
    private Long departmentId;
    private Long positionId;
    private String name;
    private String category;
    private String target;
    private String unit;
    private BigDecimal weight;
    private String period;
    private Instant createdDate;
    private Instant updatedDate;
}
