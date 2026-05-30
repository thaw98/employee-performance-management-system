package com.epms.backend.dto;

import java.time.LocalDate;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromotionRequestDto {
    @NotNull(message = "New position ID is required")
    private Long newPositionId;
    
    @NotNull(message = "Effective date is required")
    private LocalDate effectiveDate;
    
    private String remarks;

    private Long targetDepartmentId;
}
