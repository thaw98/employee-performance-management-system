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

    @NotBlank(message = "Status is required")
    private String status; // "Probation", "Permanent", "Resigned", or "Terminated"

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate probationEndDate;

    // Optional: set to "RESIGNED" or "TERMINATED" to change the employee's active status
    private String employeeStatus;
}
