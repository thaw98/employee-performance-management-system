package com.epms.backend.dto.hr;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NextStaffNoResponseDto {
	/** Next suggested numeric staff number (string of digits). */
	private String nextStaffNo;
}
