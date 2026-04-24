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
public class WeightValidationResult {
    private BigDecimal totalWeight;
    private boolean isValid;
    private String message;
}