package com.epms.backend.dto.position;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class CreatePositionRequest {

	@NotBlank(message = "Position code is required.")
	private String positionCode;

	@NotBlank(message = "Position name is required.")
	private String positionName;

	@NotNull(message = "Level code is required.")
	private Long levelCodeId;

	@NotNull(message = "Role is required.")
	private Long roleId;

	@Pattern(regexp = "^(?i)(ACTIVE|INACTIVE)$", message = "Status must be ACTIVE or INACTIVE.")
	private String status;
}