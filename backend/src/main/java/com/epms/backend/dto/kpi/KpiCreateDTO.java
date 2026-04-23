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
public class KpiCreateDTO {
    private String kpiName;
    private String category;
    private String target;
    private String unit;
    private BigDecimal weight;
    private String priorityLevel;
    private String logicDirection;
}