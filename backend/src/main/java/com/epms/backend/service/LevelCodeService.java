package com.epms.backend.service;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.dto.levelcode.CreateLevelCodeRequest;
import com.epms.backend.dto.levelcode.LevelCodeDetailDto;
import com.epms.backend.dto.levelcode.LevelCodeDto;
import com.epms.backend.dto.levelcode.LevelCodeListResponse;
import com.epms.backend.dto.levelcode.LevelCodePositionDto;
import com.epms.backend.dto.levelcode.UpdateLevelCodeRequest;
import com.epms.backend.dto.levelcode.UpdatePositionRoleRequest;
import com.epms.backend.entity.LevelCode;
import com.epms.backend.entity.Position;
import com.epms.backend.entity.Role;
import com.epms.backend.repository.LevelCodeRepository;
import com.epms.backend.repository.PositionRepository;
import com.epms.backend.repository.RoleRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LevelCodeService {

	private final LevelCodeRepository levelCodeRepository;
	private final PositionRepository positionRepository;
	private final RoleRepository roleRepository;

	@Transactional(readOnly = true)
	public LevelCodeListResponse getAllLevelCodes() {
		List<LevelCodeDto> dtos = levelCodeRepository.findAllOrderByCode().stream()
				.map(this::toDto)
				.toList();

		return LevelCodeListResponse.builder()
				.data(dtos)
				.page(0)
				.size(dtos.size())
				.totalElements(dtos.size())
				.totalPages(dtos.isEmpty() ? 0 : 1)
				.build();
	}

	@Transactional(readOnly = true)
	public LevelCodeDetailDto getLevelCodeDetail(Long id) {
		LevelCode levelCode = levelCodeRepository.findById(id)
				.orElseThrow(() -> new IllegalArgumentException("Level code not found."));
		List<LevelCodePositionDto> positions = positionRepository.findByLevelCodeIdWithRole(id).stream()
				.map(this::toPositionDto)
				.toList();

		return LevelCodeDetailDto.builder()
				.id(levelCode.getId())
				.code(levelCode.getCode())
				.description(levelCode.getDescription())
				.positions(positions)
				.positionCount(positions.size())
				.build();
	}

	@Transactional
	public LevelCodeDto createLevelCode(CreateLevelCodeRequest request) {
		String code = request.getCode().trim().toUpperCase();
		if (levelCodeRepository.existsByCodeIgnoreCase(code)) {
			throw new IllegalArgumentException("Level code already exists: " + code);
		}

		LevelCode levelCode = new LevelCode();
		levelCode.setCode(code);
		levelCode.setDescription(normalizeDescription(request.getDescription()));
		return toDto(levelCodeRepository.save(levelCode));
	}

	@Transactional
	public LevelCodeDto updateLevelCode(Long id, UpdateLevelCodeRequest request) {
		LevelCode levelCode = levelCodeRepository.findById(id)
				.orElseThrow(() -> new IllegalArgumentException("Level code not found."));
		levelCode.setDescription(normalizeDescription(request.getDescription()));
		return toDto(levelCodeRepository.save(levelCode));
	}

	@Transactional
	public LevelCodePositionDto updatePositionRole(Long positionId, UpdatePositionRoleRequest request) {
		Position position = positionRepository.findByIdWithLevelCodeAndRole(positionId)
				.orElseThrow(() -> new IllegalArgumentException("Position not found."));
		Role role = roleRepository.findById(request.getRoleId())
				.orElseThrow(() -> new IllegalArgumentException("Role not found."));

		position.setRole(role);
		position.setUpdatedDate(Instant.now());
		return toPositionDto(positionRepository.save(position));
	}

	private LevelCodeDto toDto(LevelCode levelCode) {
		return LevelCodeDto.builder()
				.id(levelCode.getId())
				.code(levelCode.getCode())
				.description(levelCode.getDescription())
				.positionCount(Math.toIntExact(positionRepository.countByLevelCodeId(levelCode.getId())))
				.build();
	}

	private LevelCodePositionDto toPositionDto(Position position) {
		return LevelCodePositionDto.builder()
				.positionId(position.getId())
				.positionCode(position.getCode())
				.positionName(position.getName())
				.roleId(position.getRole() != null ? position.getRole().getId() : null)
				.roleName(position.getRole() != null ? position.getRole().getName() : null)
				.status(position.getStatus())
				.build();
	}

	private String normalizeDescription(String description) {
		return description == null || description.isBlank() ? null : description.trim();
	}
}
