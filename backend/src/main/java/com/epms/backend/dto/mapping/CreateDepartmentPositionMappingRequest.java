package com.epms.backend.dto.mapping;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class CreateDepartmentPositionMappingRequest {

	@NotNull(message = "Department is required.")
	private Long departmentId;

	@NotNull(message = "Position is required.")
	private Long positionId;

	@Pattern(regexp = "^(?i)(ACTIVE|INACTIVE)$", message = "Status must be ACTIVE or INACTIVE.")
	private String status;
}