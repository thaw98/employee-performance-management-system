package com.epms.backend.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.epms.backend.dto.CriteriaDto;
import com.epms.backend.entity.Criteria;
import com.epms.backend.repository.CriteriaRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CriteriaService {

    private final CriteriaRepository criteriaRepository;

    public List<CriteriaDto> getAllCriteria() {
        return criteriaRepository.findAllByOrderBySortOrderAscIdAsc().stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public CriteriaDto createCriteria(CriteriaDto dto) {
        if (dto.getName() == null || dto.getName().trim().isEmpty()) {
            throw new RuntimeException("Criteria name is required");
        }
        Criteria criteria = new Criteria();
        criteria.setName(dto.getName());
        criteria.setDescription(dto.getDescription());
        criteria.setActive(dto.isActive());
        criteria.setSortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : 0);
        Criteria saved = criteriaRepository.save(criteria);
        return mapToDto(saved);
    }

    public CriteriaDto updateCriteria(Long id, CriteriaDto dto) {
        if (dto.getName() == null || dto.getName().trim().isEmpty()) {
            throw new RuntimeException("Criteria name is required");
        }
        Criteria criteria = criteriaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Criteria not found"));
        criteria.setName(dto.getName());
        criteria.setDescription(dto.getDescription());
        criteria.setActive(dto.isActive());
        if (dto.getSortOrder() != null) {
            criteria.setSortOrder(dto.getSortOrder());
        }
        Criteria saved = criteriaRepository.save(criteria);
        return mapToDto(saved);
    }

    public void deleteCriteria(Long id) {
        criteriaRepository.deleteById(id);
    }

    private CriteriaDto mapToDto(Criteria criteria) {
        CriteriaDto dto = new CriteriaDto();
        dto.setId(criteria.getId());
        dto.setName(criteria.getName());
        dto.setDescription(criteria.getDescription());
        dto.setActive(criteria.isActive());
        dto.setSortOrder(criteria.getSortOrder());
        return dto;
    }
}
