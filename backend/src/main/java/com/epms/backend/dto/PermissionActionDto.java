package com.epms.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionActionDto {
    private Long id;
    private String moduleKey;
    private String actionKey;
    private String displayName;
    private Integer sortOrder;
}
