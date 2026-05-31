package com.epms.backend.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateEmployeePermissionRequest {

    private String moduleKey;
    private List<EmployeePermissionOverride> permissions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployeePermissionOverride {
        private String moduleKey;
        private String actionKey;
        private Boolean override;
    }
}
