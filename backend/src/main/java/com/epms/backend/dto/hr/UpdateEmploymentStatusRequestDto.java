package com.epms.backend.dto.hr;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpdateEmploymentStatusRequestDto {

    @NotBlank(message = "Target status is required")
    private String targetStatus; // "PERMANENT", "RESIGNED", or "TERMINATED"

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate effectiveDate;

    // Required for PERMANENT transition: "NOW" or "CUSTOM".
    private String transitionMode;
}
