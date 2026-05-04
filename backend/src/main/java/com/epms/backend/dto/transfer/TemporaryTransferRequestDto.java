package com.epms.backend.dto.transfer;

import java.time.LocalDate;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TemporaryTransferRequestDto {

    @NotNull(message = "Target department is required")
    private Long toDepartmentId;

    @NotNull(message = "Target position is required")
    private Long toPositionId;

    @NotNull(message = "Effective start date is required")
    private LocalDate effectiveStartDate;

    @NotNull(message = "Effective end date is required")
    private LocalDate effectiveEndDate;

    private String reason;
    private String remarks;

    @AssertTrue(message = "Effective end date must be after effective start date")
    public boolean isEffectiveEndDateAfterStartDate() {
        return effectiveStartDate == null || effectiveEndDate == null || effectiveEndDate.isAfter(effectiveStartDate);
    }
}
