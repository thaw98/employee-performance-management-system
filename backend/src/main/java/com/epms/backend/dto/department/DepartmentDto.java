package com.epms.backend.dto.department;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentDto {
    private Long departmentId;
    private String departmentCode;
    private String departmentName;
    private String status;
    private Instant createdDate;
    private Instant updatedDate;
}
