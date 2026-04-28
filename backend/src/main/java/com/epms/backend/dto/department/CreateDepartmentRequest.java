package com.epms.backend.dto.department;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class CreateDepartmentRequest {

    @NotBlank(message = "Department code is required.")
    private String departmentCode;

    @NotBlank(message = "Department name is required.")
    private String departmentName;

    @Pattern(regexp = "^(?i)(Active|Inactive)$", message = "Status must be Active or Inactive.")
    private String status;

    @NotNull(message = "Manager is required.")
    private Long managerId;
}
