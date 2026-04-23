package com.epms.backend.dto.mapping;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentPositionMappingOptionDto {
	private Long id;
	private Long positionId;
	private String positionName;
	private String positionCode;
	private String levelCodeName;
}