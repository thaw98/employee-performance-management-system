package com.epms.backend.service;

import java.util.List;
import java.util.Set;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.dto.master.MasterOptionDto;
import com.epms.backend.entity.Position;
import com.epms.backend.repository.DepartmentRepository;
import com.epms.backend.repository.PositionRepository;
import com.epms.backend.repository.ReligionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MasterDataService {
	private static final Set<String> EXCLUDED_POSITION_NAMES = Set.of("CEO", "COO", "Chairman");

	private final ReligionRepository religionRepository;
	private final DepartmentRepository departmentRepository;
	private final PositionRepository positionRepository;

	@Transactional(readOnly = true)
	public List<MasterOptionDto> getReligions() {
		return religionRepository.findAllByOrderByNameAsc()
				.stream()
				.map(r -> new MasterOptionDto(r.getId(), r.getName()))
				.toList();
	}

	@Transactional(readOnly = true)
	public List<MasterOptionDto> autocompleteDepartments(String keyword) {
		return departmentRepository.findTop20ByNameContainingIgnoreCaseOrderByNameAsc(keyword == null ? "" : keyword.trim())
				.stream()
				.map(d -> new MasterOptionDto(d.getId(), d.getName()))
				.toList();
	}

	@Transactional(readOnly = true)
	public List<MasterOptionDto> autocompletePositions(String keyword, Long departmentId) {
		String kw = keyword == null ? "" : keyword.trim();
		List<Position> positions = departmentId == null
				? positionRepository.findTop20ByNameContainingIgnoreCaseOrderByNameAsc(kw)
				: positionRepository.findForAutocompleteByDepartmentOrUnassigned(departmentId, kw, PageRequest.of(0, 20));
		return positions.stream()
				.filter(p -> EXCLUDED_POSITION_NAMES.stream().noneMatch(excluded -> excluded.equalsIgnoreCase(p.getName())))
				.map(p -> new MasterOptionDto(p.getId(), p.getName()))
				.toList();
	}
}
