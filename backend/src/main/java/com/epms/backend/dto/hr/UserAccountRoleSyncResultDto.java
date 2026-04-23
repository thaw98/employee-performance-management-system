package com.epms.backend.dto.hr;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserAccountRoleSyncResultDto {
	private int updated;
	private int skippedNoPosition;
	private int skippedPositionNotFound;
	private int skippedNoRole;
	private int unchanged;
	private int failed;
	private String summaryMessage;
}
