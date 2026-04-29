package com.epms.backend.dto.levelcode;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateLevelCodeRequest {
	@Size(max = 50, message = "Description must be at most 50 characters")
	private String description;
}
