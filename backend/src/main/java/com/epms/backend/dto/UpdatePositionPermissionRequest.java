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
public class UpdatePositionPermissionRequest {
    private String moduleKey;
    private List<PermissionToggleUpdate> permissions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PermissionToggleUpdate {
        private String moduleKey;
        private String actionKey;
        private boolean allowed;
    }
}
