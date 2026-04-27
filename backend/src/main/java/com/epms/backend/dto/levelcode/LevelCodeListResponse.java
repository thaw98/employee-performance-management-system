package com.epms.backend.dto.levelcode;

import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LevelCodeListResponse {
	private List<LevelCodeDto> data;
	private int page;
	private int size;
	private long totalElements;
	private int totalPages;
}
