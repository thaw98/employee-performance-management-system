package com.epms.backend.dto.kpi;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PositionKpiDto {
    private Long id;
    private Long positionId;
    private String positionName;
    private String kpiName;
    private String category;
    private String target;
    private String unit;
    private BigDecimal weight;
    private String priorityLevel;
    private String logicDirection;
    private Integer displayOrder;
    private Boolean isActive;
    private BigDecimal actualValue;
    private Long assignmentId;
    private Boolean isLocked;
    private String updatedBy;
    private BigDecimal score;
    private BigDecimal weightedScore;
    private String remarks;
}
