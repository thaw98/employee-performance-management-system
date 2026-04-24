package com.epms.backend.service;

import com.epms.backend.dto.mapping.CreateDepartmentPositionMappingRequest;
import com.epms.backend.dto.mapping.DepartmentPositionMappingDto;
import com.epms.backend.dto.mapping.DepartmentPositionMappingListResponse;
import com.epms.backend.dto.mapping.UpdateDepartmentPositionMappingRequest;

public interface DepartmentPositionMappingService {

	DepartmentPositionMappingListResponse getMappings(int page, int size, String search, String sortBy,
			String sortDir);

	DepartmentPositionMappingDto getMappingById(Long id);

	DepartmentPositionMappingDto createMapping(CreateDepartmentPositionMappingRequest request);

	DepartmentPositionMappingDto updateMapping(Long id, UpdateDepartmentPositionMappingRequest request);

	DepartmentPositionMappingDto toggleStatus(Long id);
}