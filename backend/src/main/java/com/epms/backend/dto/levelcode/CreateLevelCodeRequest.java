package com.epms.backend.dto.levelcode;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateLevelCodeRequest {
	@NotBlank(message = "Level code is required")
	@Size(max = 10, message = "Level code must be at most 10 characters")
	private String code;

	@Size(max = 50, message = "Description must be at most 50 characters")
	private String description;
}
