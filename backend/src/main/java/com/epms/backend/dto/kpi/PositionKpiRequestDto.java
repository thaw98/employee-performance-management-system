package com.epms.backend.dto.kpi;

import lombok.Data;
import java.util.List;

@Data
public class PositionKpiRequestDto {
    private Long positionId;
    private List<PositionKpiDto> kpis;
    private boolean isFinal;
}
