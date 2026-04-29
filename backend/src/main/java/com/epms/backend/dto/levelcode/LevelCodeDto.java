package com.epms.backend.dto.levelcode;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LevelCodeDto {
	private Long id;
	private String code;
	private String description;
	private int positionCount;
}
