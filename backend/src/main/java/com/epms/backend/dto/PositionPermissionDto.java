package com.epms.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PositionPermissionDto {
    private Long positionId;
    private String positionName;
    private String positionCode;
    private String levelCode;
    private String levelCodeDescription;
    private String roleName;
    private String moduleKey;
    private String actionKey;
    private boolean allowed;
}
