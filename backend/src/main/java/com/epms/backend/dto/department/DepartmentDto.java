package com.epms.backend.dto.department;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonProperty;

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
    private Long managerId;
    private String managerName;
    private Instant createdDate;
    private Instant updatedDate;

    @JsonProperty("id")
    public Long getId() {
        return departmentId;
    }

    @JsonProperty("code")
    public String getCode() {
        return departmentCode;
    }

    @JsonProperty("name")
    public String getName() {
        return departmentName;
    }

    @JsonProperty("active")
    public boolean isActive() {
        return status == null || "active".equalsIgnoreCase(status.trim());
    }

    @JsonProperty("isActive")
    public boolean getIsActive() {
        return isActive();
    }
}
