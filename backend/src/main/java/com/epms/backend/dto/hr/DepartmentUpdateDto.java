package com.epms.backend.dto.hr;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DepartmentUpdateDto {
    @NotBlank(message = "Department code is required.")
    private String departmentCode;

    @NotBlank(message = "Department name is required.")
    private String departmentName;

    private String status;
}
