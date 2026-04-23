package com.epms.backend.dto.mapping;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentPositionMappingListResponse {
	private List<DepartmentPositionMappingDto> content;
	private int page;
	private int size;
	private long totalElements;
	private int totalPages;
}