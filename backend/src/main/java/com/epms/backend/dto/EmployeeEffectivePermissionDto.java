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
public class EmployeeEffectivePermissionDto {

    private Long employeeId;
    private String employeeName;
    private String employeeCode;
    private String positionName;
    private String positionCode;
    private Long positionId;
    private Long roleId;
    private String roleName;
    private String departmentName;
    private List<PermissionDetail> permissionDetails;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PermissionDetail {
        private String moduleKey;
        private String actionKey;
        private Boolean positionPermission;
        private Boolean override;
        private Boolean effective;
    }
}
