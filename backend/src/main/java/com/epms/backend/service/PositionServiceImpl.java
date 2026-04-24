package com.epms.backend.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.dto.position.CreatePositionRequest;
import com.epms.backend.dto.position.PositionDto;
import com.epms.backend.dto.position.PositionListResponse;
import com.epms.backend.dto.position.UpdatePositionRequest;
import com.epms.backend.entity.LevelCode;
import com.epms.backend.entity.Position;
import com.epms.backend.entity.Role;
import com.epms.backend.repository.LevelCodeRepository;
import com.epms.backend.repository.PositionRepository;
import com.epms.backend.repository.RoleRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PositionServiceImpl implements PositionService {

	private final PositionRepository positionRepository;
	private final LevelCodeRepository levelCodeRepository;
	private final RoleRepository roleRepository;

	private static final String STATUS_ACTIVE = "ACTIVE";
	private static final String STATUS_INACTIVE = "INACTIVE";

	@Override
	@Transactional(readOnly = true)
	public PositionListResponse getPositions(int page, int size, String search, String positionName, Long roleId,
			String sortBy, String sortDir) {
		Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
		Sort sort = Sort.by(direction, mapSortField(sortBy));
		Pageable pageable = PageRequest.of(page, size, sort);

		Specification<Position> spec = buildSpecification(search, positionName, roleId);

		Page<Position> positionPage = positionRepository.findAll(spec, pageable);
		List<PositionDto> content = positionPage.getContent().stream()
				.map(this::mapToDto)
				.toList();

		return PositionListResponse.builder()
				.content(content)
				.page(positionPage.getNumber())
				.size(positionPage.getSize())
				.totalElements(positionPage.getTotalElements())
				.totalPages(positionPage.getTotalPages())
				.build();
	}

	@Override
	@Transactional(readOnly = true)
	public PositionDto getPositionById(Long id) {
		Position position = positionRepository.findByIdWithLevelCodeAndRole(id)
				.orElseThrow(() -> new IllegalArgumentException("Position not found."));
		return mapToDto(position);
	}

	@Override
	@Transactional
	public PositionDto createPosition(CreatePositionRequest request) {
		String code = request.getPositionCode().trim();
		String name = request.getPositionName().trim();

		if (positionRepository.findByCodeIgnoreCase(code).isPresent()) {
			throw new IllegalArgumentException("Position code already exists.");
		}
		if (positionRepository.findByNameIgnoreCase(name).isPresent()) {
			throw new IllegalArgumentException("Position name already exists.");
		}

		LevelCode levelCode = levelCodeRepository.findById(request.getLevelCodeId())
				.orElseThrow(() -> new IllegalArgumentException("Level code not found."));
		Role role = roleRepository.findById(request.getRoleId())
				.orElseThrow(() -> new IllegalArgumentException("Role not found."));

		Position position = new Position();
		position.setCode(code);
		position.setName(name);
		position.setLevelCode(levelCode);
		position.setRole(role);
		position.setStatus(normalizeStatus(request.getStatus()));
		position.setCreatedDate(Instant.now());
		position.setUpdatedDate(Instant.now());

		Position saved = positionRepository.save(position);
		return mapToDto(saved);
	}

	@Override
	@Transactional
	public PositionDto updatePosition(Long id, UpdatePositionRequest request) {
		Position position = positionRepository.findByIdWithLevelCodeAndRole(id)
				.orElseThrow(() -> new IllegalArgumentException("Position not found."));

		String code = request.getPositionCode().trim();
		String name = request.getPositionName().trim();

		if (positionRepository.existsByCodeIgnoreCaseAndIdNot(code, id)) {
			throw new IllegalArgumentException("Position code already exists.");
		}
		if (positionRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
			throw new IllegalArgumentException("Position name already exists.");
		}

		LevelCode levelCode = levelCodeRepository.findById(request.getLevelCodeId())
				.orElseThrow(() -> new IllegalArgumentException("Level code not found."));
		Role role = roleRepository.findById(request.getRoleId())
				.orElseThrow(() -> new IllegalArgumentException("Role not found."));

		position.setCode(code);
		position.setName(name);
		position.setLevelCode(levelCode);
		position.setRole(role);
		position.setStatus(normalizeStatus(request.getStatus()));
		position.setUpdatedDate(Instant.now());

		Position saved = positionRepository.save(position);
		return mapToDto(saved);
	}

	@Override
	@Transactional
	public PositionDto toggleStatus(Long id) {
		Position position = positionRepository.findByIdWithLevelCodeAndRole(id)
				.orElseThrow(() -> new IllegalArgumentException("Position not found."));

		String currentStatus = position.getStatus();
		if (STATUS_ACTIVE.equalsIgnoreCase(currentStatus)) {
			position.setStatus(STATUS_INACTIVE);
		} else {
			position.setStatus(STATUS_ACTIVE);
		}
		position.setUpdatedDate(Instant.now());

		Position saved = positionRepository.save(position);
		return mapToDto(saved);
	}

	private Specification<Position> buildSpecification(String search, String positionName, Long roleId) {
		return (root, query, cb) -> {
			List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();

			if (search != null && !search.isBlank()) {
				String pattern = "%" + search.toLowerCase() + "%";
				predicates.add(cb.or(
						cb.like(cb.lower(root.get("code")), pattern),
						cb.like(cb.lower(root.get("levelCode").get("code")), pattern)));
			}

			if (positionName != null && !positionName.isBlank()) {
				predicates.add(cb.equal(cb.lower(root.get("name")), positionName.toLowerCase()));
			}

			if (roleId != null) {
				predicates.add(cb.equal(root.get("role").get("id"), roleId));
			}

			return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
		};
	}

	private String mapSortField(String sortBy) {
		return switch (sortBy) {
			case "positionCode" -> "code";
			case "positionName" -> "name";
			case "levelCodeName" -> "levelCode.code";
			case "roleName" -> "role.name";
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

	private PositionDto mapToDto(Position position) {
		return PositionDto.builder()
				.positionId(position.getId())
				.positionCode(position.getCode())
				.positionName(position.getName())
				.status(position.getStatus() == null ? null : position.getStatus().toUpperCase())
				.levelCodeId(position.getLevelCode() != null ? position.getLevelCode().getId() : null)
				.levelCodeName(position.getLevelCode() != null ? position.getLevelCode().getCode() : null)
				.roleId(position.getRole() != null ? position.getRole().getId() : null)
				.roleName(position.getRole() != null ? position.getRole().getName() : null)
				.createdDate(position.getCreatedDate())
				.updatedDate(position.getUpdatedDate())
				.build();
	}
}