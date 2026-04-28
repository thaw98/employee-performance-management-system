package com.epms.backend.dto.pip;

import java.time.LocalDate;

import lombok.Data;

@Data
public class PipReviewRequest {
    private String action; // "CONFIRMED" or "DENIED"
    private String reason;
    private LocalDate extendedEndDate;
}
