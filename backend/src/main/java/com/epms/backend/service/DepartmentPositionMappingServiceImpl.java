package com.epms.backend.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.dto.mapping.CreateDepartmentPositionMappingRequest;
import com.epms.backend.dto.mapping.DepartmentPositionMappingDto;
import com.epms.backend.dto.mapping.DepartmentPositionMappingListResponse;
import com.epms.backend.dto.mapping.UpdateDepartmentPositionMappingRequest;
import com.epms.backend.entity.Department;
import com.epms.backend.entity.DepartmentHasPosition;
import com.epms.backend.entity.Position;
import com.epms.backend.repository.DepartmentHasPositionRepository;
import com.epms.backend.repository.DepartmentRepository;
import com.epms.backend.repository.PositionRepository;
import com.epms.backend.security.UserPrincipal;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DepartmentPositionMappingServiceImpl implements DepartmentPositionMappingService {

	private final DepartmentHasPositionRepository mappingRepository;
	private final DepartmentRepository departmentRepository;
	private final PositionRepository positionRepository;

	private static final String STATUS_ACTIVE = "ACTIVE";
	private static final String STATUS_INACTIVE = "INACTIVE";

	@Override
	@Transactional(readOnly = true)
	public DepartmentPositionMappingListResponse getMappings(int page, int size, String search, String sortBy,
			String sortDir) {
		Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
		Sort sort = Sort.by(direction, mapSortField(sortBy));
		Pageable pageable = PageRequest.of(page, size, sort);

		Specification<DepartmentHasPosition> spec = buildSpecification(search);

		Page<DepartmentHasPosition> mappingPage = mappingRepository.findAll(spec, pageable);
		List<DepartmentPositionMappingDto> content = mappingPage.getContent().stream()
				.map(this::mapToDto)
				.toList();

		return DepartmentPositionMappingListResponse.builder()
				.content(content)
				.page(mappingPage.getNumber())
				.size(mappingPage.getSize())
				.totalElements(mappingPage.getTotalElements())
				.totalPages(mappingPage.getTotalPages())
				.build();
	}

	@Override
	@Transactional(readOnly = true)
	public DepartmentPositionMappingDto getMappingById(Long id) {
		DepartmentHasPosition mapping = mappingRepository.findById(id)
				.orElseThrow(() -> new IllegalArgumentException("Mapping not found."));
		return mapToDto(mapping);
	}

	@Override
	@Transactional
	public DepartmentPositionMappingDto createMapping(CreateDepartmentPositionMappingRequest request) {
		Department department = departmentRepository.findById(request.getDepartmentId())
				.orElseThrow(() -> new IllegalArgumentException("Department not found."));
		Position position = positionRepository.findById(request.getPositionId())
				.orElseThrow(() -> new IllegalArgumentException("Position not found."));
		if (!isActive(department.getStatus())) {
			throw new IllegalArgumentException("Only active departments can be mapped.");
		}
		if (!isActive(position.getStatus())) {
			throw new IllegalArgumentException("Only active positions can be mapped.");
		}
		Long actorId = getCurrentUserId();

		// Check if active mapping already exists
		if (mappingRepository.existsByDepartmentIdAndPositionIdAndStatusIgnoreCase(
				request.getDepartmentId(), request.getPositionId(), STATUS_ACTIVE)) {
			throw new IllegalArgumentException("Active mapping for this department and position already exists.");
		}

		// Check if inactive mapping exists - reactivate it
		DepartmentHasPosition mapping = mappingRepository
				.findByDepartmentIdAndPositionId(request.getDepartmentId(), request.getPositionId())
				.orElse(null);
		if (mapping != null) {
			mapping.setStatus(STATUS_ACTIVE);
			mapping.setUpdatedBy(actorId);
			mapping.setUpdatedOn(Instant.now());
			return mapToDto(mappingRepository.save(mapping));
		}

		DepartmentHasPosition newMapping = new DepartmentHasPosition();
		newMapping.setDepartment(department);
		newMapping.setPosition(position);
		newMapping.setStatus(normalizeStatus(request.getStatus()));
		newMapping.setCreatedBy(actorId);
		newMapping.setCreatedOn(Instant.now());
		newMapping.setUpdatedBy(actorId);
		newMapping.setUpdatedOn(Instant.now());
		return mapToDto(mappingRepository.save(newMapping));
	}

	@Override
	@Transactional
	public DepartmentPositionMappingDto updateMapping(Long id, UpdateDepartmentPositionMappingRequest request) {
		DepartmentHasPosition mapping = mappingRepository.findById(id)
				.orElseThrow(() -> new IllegalArgumentException("Mapping not found."));

		// Only allow status change for update (safer approach)
		mapping.setStatus(normalizeStatus(request.getStatus()));
		mapping.setUpdatedBy(getCurrentUserId());
		mapping.setUpdatedOn(Instant.now());

		DepartmentHasPosition saved = mappingRepository.save(mapping);
		return mapToDto(saved);
	}

	@Override
	@Transactional
	public DepartmentPositionMappingDto toggleStatus(Long id) {
		DepartmentHasPosition mapping = mappingRepository.findById(id)
				.orElseThrow(() -> new IllegalArgumentException("Mapping not found."));

		String currentStatus = mapping.getStatus();
		if (STATUS_ACTIVE.equalsIgnoreCase(currentStatus)) {
			mapping.setStatus(STATUS_INACTIVE);
		} else {
			mapping.setStatus(STATUS_ACTIVE);
		}
		mapping.setUpdatedBy(getCurrentUserId());
		mapping.setUpdatedOn(Instant.now());

		DepartmentHasPosition saved = mappingRepository.save(mapping);
		return mapToDto(saved);
	}

	private Specification<DepartmentHasPosition> buildSpecification(String search) {
		return (root, query, cb) -> {
			List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();

			if (search != null && !search.isBlank()) {
				String pattern = "%" + search.toLowerCase() + "%";
				predicates.add(cb.or(
						cb.like(cb.lower(root.get("department").get("name")), pattern),
						cb.like(cb.lower(root.get("position").get("name")), pattern),
						cb.like(cb.lower(root.get("position").get("code")), pattern)));
			}

			return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
		};
	}

	private String mapSortField(String sortBy) {
		return switch (sortBy) {
			case "departmentName" -> "department.name";
			case "positionCode" -> "position.code";
			case "positionName" -> "position.name";
			case "status" -> "status";
			default -> "id";
		};
	}

	private String normalizeStatus(String status) {
		if (status == null || status.isBlank()) {
			return STATUS_ACTIVE;
		}
		String normalized = status.trim();
		if ("active".equalsIgnoreCase(normalized)) {
			return STATUS_ACTIVE;
		}
		if ("inactive".equalsIgnoreCase(normalized)) {
			return STATUS_INACTIVE;
		}
		throw new IllegalArgumentException("Status must be ACTIVE or INACTIVE.");
	}

	private DepartmentPositionMappingDto mapToDto(DepartmentHasPosition mapping) {
		return DepartmentPositionMappingDto.builder()
				.id(mapping.getId())
				.departmentId(mapping.getDepartment().getId())
				.departmentName(mapping.getDepartment().getName())
				.positionId(mapping.getPosition().getId())
				.positionCode(mapping.getPosition().getCode())
				.positionName(mapping.getPosition().getName())
				.status(mapping.getStatus() == null ? null : mapping.getStatus().toUpperCase())
				.createdOn(mapping.getCreatedOn())
				.updatedOn(mapping.getUpdatedOn())
				.build();
	}

	private boolean isActive(String status) {
		return status == null || "active".equalsIgnoreCase(status.trim());
	}

	private Long getCurrentUserId() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
			return null;
		}
		return principal.getId();
	}
}