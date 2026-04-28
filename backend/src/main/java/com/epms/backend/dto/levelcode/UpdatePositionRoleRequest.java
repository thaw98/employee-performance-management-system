package com.epms.backend.dto.levelcode;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdatePositionRoleRequest {
	@NotNull(message = "Role ID is required")
	private Long roleId;
}
