package com.epms.backend.dto.position;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PositionListResponse {
	private List<PositionDto> content;
	private int page;
	private int size;
	private long totalElements;
	private int totalPages;
}