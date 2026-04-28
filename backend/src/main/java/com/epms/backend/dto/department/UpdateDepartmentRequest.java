package com.epms.backend.dto.department;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateDepartmentRequest {

    @NotBlank(message = "Department code is required.")
    private String departmentCode;

    @NotBlank(message = "Department name is required.")
    private String departmentName;

    @NotBlank(message = "Status is required.")
    @Pattern(regexp = "^(?i)(Active|Inactive)$", message = "Status must be Active or Inactive.")
    private String status;

    private Long managerId;
}
