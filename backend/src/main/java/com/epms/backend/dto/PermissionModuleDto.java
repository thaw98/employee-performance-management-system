package com.epms.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionModuleDto {
    private Long id;
    private String moduleKey;
    private String displayName;
    private String description;
    private Integer sortOrder;
}
