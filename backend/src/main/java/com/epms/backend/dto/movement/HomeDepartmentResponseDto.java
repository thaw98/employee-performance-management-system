package com.epms.backend.dto.movement;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomeDepartmentResponseDto {

    private Long departmentId;
    private String departmentName;
    private String derivedFrom;
}
