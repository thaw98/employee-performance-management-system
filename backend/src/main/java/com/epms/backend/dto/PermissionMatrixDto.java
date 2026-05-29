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
public class PermissionMatrixDto {
    private List<PermissionModuleDto> modules;
    private List<PermissionActionDto> actions;
    private List<PermissionMatrixPositionRow> positions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PermissionMatrixPositionRow {
        private Long positionId;
        private String positionName;
        private String positionCode;
        private Long levelCodeId;
        private String levelCode;
        private String levelCodeDescription;
        private Long roleId;
        private String roleName;
        private List<PermissionToggle> permissions;

        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class PermissionToggle {
            private String moduleKey;
            private String actionKey;
            private boolean allowed;
        }
    }
}
