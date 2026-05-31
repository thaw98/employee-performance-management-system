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
public class EmployeePermissionDto {

    private List<PermissionModuleDto> modules;
    private List<PermissionActionDto> actions;
    private List<EmployeePermissionRow> employees;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployeePermissionRow {
        private Long employeeId;
        private String employeeName;
        private String employeeCode;
        private String positionName;
        private String positionCode;
        private String departmentName;
        private Long roleId;
        private String roleName;
        private List<EmployeePermissionToggle> permissions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployeePermissionToggle {
        private String moduleKey;
        private String actionKey;
        private Boolean positionAllowed;
        private Boolean override;
        private Boolean effective;
    }
}
