package com.epms.backend.service;

import java.util.Comparator;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.dto.master.MasterOptionDto;
import com.epms.backend.repository.DepartmentRepository;
import com.epms.backend.repository.NationalityRepository;
import com.epms.backend.repository.PositionRepository;
import com.epms.backend.repository.ReligionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MasterDataService {
	private static final Set<String> EXCLUDED_POSITION_NAMES = Set.of("CEO", "COO", "Chairman");

	private final ReligionRepository religionRepository;
	private final NationalityRepository nationalityRepository;
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
	public List<MasterOptionDto> getNationalities() {
		return nationalityRepository.findAllByOrderByNameAsc()
				.stream()
				.map(n -> new MasterOptionDto(n.getId(), n.getName()))
				.sorted(Comparator.comparing((MasterOptionDto o) -> !o.getName().equalsIgnoreCase("Burmese")).thenComparing(MasterOptionDto::getName))
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
	public List<MasterOptionDto> autocompletePositions(String keyword) {
		return positionRepository.findTop20ByNameContainingIgnoreCaseOrderByNameAsc(keyword == null ? "" : keyword.trim())
				.stream()
				.filter(p -> EXCLUDED_POSITION_NAMES.stream().noneMatch(excluded -> excluded.equalsIgnoreCase(p.getName())))
				.map(p -> new MasterOptionDto(p.getId(), p.getName()))
				.toList();
	}
}
