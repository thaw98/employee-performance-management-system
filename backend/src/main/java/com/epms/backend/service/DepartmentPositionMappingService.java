package com.epms.backend.service;

import java.util.List;

import com.epms.backend.dto.mapping.CreateDepartmentPositionMappingRequest;
import com.epms.backend.dto.mapping.DepartmentPositionMappingDto;
import com.epms.backend.dto.mapping.DepartmentPositionMappingListResponse;
import com.epms.backend.dto.mapping.UpdateDepartmentPositionMappingRequest;

public interface DepartmentPositionMappingService {

	DepartmentPositionMappingListResponse getMappings(int page, int size, String search, String sortBy,
			String sortDir);

	DepartmentPositionMappingDto getMappingById(Long id);

	List<DepartmentPositionMappingDto> getMappingsByDepartment(Long departmentId);

	DepartmentPositionMappingDto createMapping(CreateDepartmentPositionMappingRequest request);

	DepartmentPositionMappingDto updateMapping(Long id, UpdateDepartmentPositionMappingRequest request);

	DepartmentPositionMappingDto toggleStatus(Long id);

	void deleteMapping(Long id);
}
