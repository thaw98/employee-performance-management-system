package com.epms.backend.dto.pip;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PipSignatureRequest {
    @NotBlank(message = "Signature is required")
    private String signature;
}
