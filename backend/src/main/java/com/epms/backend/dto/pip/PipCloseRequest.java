package com.epms.backend.dto.pip;

import lombok.Data;

@Data
public class PipCloseRequest {
    private String finalOutcome;
    private String closingRemarks;
}
