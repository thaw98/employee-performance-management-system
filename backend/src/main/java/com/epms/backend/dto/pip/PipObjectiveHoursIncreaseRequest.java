package com.epms.backend.dto.pip;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class PipObjectiveHoursIncreaseRequest {
    private BigDecimal additionalHours;
    private String note;
}
