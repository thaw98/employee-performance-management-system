package com.epms.backend.dto.kpi;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkKpiAssignmentDTO {
    private Long employeeId;
    private Long periodId;
    private List<KpiCreateDTO> kpis;
    private boolean isFinal;
}