package com.epms.backend.dto.hr;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PositionKpiStatusDto {
    private Long departmentId;
    private String departmentName;
    private Long positionId;
    private String positionName;
    private boolean hasKpis;
}
