package com.epms.backend.dto.hr;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PositionOptionDto {
	private Long positionId;
	private String positionName;
	/** Derived from {@code position.role_id}; for display only. */
	private Long roleId;
	/** Role name for display; may be null if unlinked. */
	private String roleName;
}
