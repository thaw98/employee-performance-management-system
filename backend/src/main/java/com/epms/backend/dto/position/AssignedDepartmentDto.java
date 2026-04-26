package com.epms.backend.dto.position;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignedDepartmentDto {
	private Long departmentId;
	private String departmentCode;
	private String departmentName;
}
