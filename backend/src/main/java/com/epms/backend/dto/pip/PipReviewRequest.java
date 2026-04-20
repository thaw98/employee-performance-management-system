package com.epms.backend.dto.pip;

import lombok.Data;

@Data
public class PipReviewRequest {
    private String action; // "CONFIRMED" or "DENIED"
}
