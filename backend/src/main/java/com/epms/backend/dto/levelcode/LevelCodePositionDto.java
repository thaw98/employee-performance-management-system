package com.epms.backend.dto.levelcode;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LevelCodePositionDto {
	private Long positionId;
	private String positionCode;
	private String positionName;
	private Long roleId;
	private String roleName;
	private String status;
}
