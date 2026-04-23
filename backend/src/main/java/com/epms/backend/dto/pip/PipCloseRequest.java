package com.epms.backend.dto.pip;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PipCloseRequest {
    @NotBlank(message = "Final outcome is required")
    private String finalOutcome;

    @NotBlank(message = "Closing remarks are required")
    private String closingRemarks;
}
