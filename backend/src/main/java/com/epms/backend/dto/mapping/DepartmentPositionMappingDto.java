package com.epms.backend.dto.mapping;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentPositionMappingDto {
	private Long id;
	private Long departmentId;
	private String departmentName;
	private Long positionId;
	private String positionCode;
	private String positionName;
	private String status;
	private Instant createdOn;
	private Instant updatedOn;
}