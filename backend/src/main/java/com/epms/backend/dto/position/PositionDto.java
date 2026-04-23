package com.epms.backend.dto.position;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PositionDto {
	private Long positionId;
	private String positionCode;
	private String positionName;
	private String status;
	private Long levelCodeId;
	private String levelCodeName;
	private Long roleId;
	private String roleName;
	private Instant createdDate;
	private Instant updatedDate;
}