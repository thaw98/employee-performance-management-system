package com.epms.backend.dto.levelcode;

import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LevelCodeDetailDto {
	private Long id;
	private String code;
	private String description;
	private List<LevelCodePositionDto> positions;
	private int positionCount;
}
