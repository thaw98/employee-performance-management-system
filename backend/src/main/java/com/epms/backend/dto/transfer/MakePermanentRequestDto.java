package com.epms.backend.dto.transfer;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MakePermanentRequestDto {

    @NotNull(message = "Effective start date is required")
    private LocalDate effectiveStartDate;

    private String reason;
    private String remarks;
}
