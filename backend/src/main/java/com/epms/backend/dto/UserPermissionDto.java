package com.epms.backend.dto;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPermissionDto {
    private Long userId;
    private Long positionId;
    private String positionName;
    private String roleName;
    private Map<String, Map<String, Boolean>> permissions;
}
