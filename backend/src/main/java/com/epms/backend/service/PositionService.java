package com.epms.backend.service;

import com.epms.backend.dto.position.CreatePositionRequest;
import com.epms.backend.dto.position.PositionDto;
import com.epms.backend.dto.position.PositionListResponse;
import com.epms.backend.dto.position.UpdatePositionRequest;

public interface PositionService {

	PositionListResponse getPositions(int page, int size, String search, String positionName, Long roleId,
			String sortBy, String sortDir);

	PositionDto getPositionById(Long id);

	PositionDto createPosition(CreatePositionRequest request);

	PositionDto updatePosition(Long id, UpdatePositionRequest request);

	PositionDto toggleStatus(Long id);
}