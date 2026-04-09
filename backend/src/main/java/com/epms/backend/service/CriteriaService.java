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
        return criteriaRepository.findAll().stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public CriteriaDto createCriteria(CriteriaDto dto) {
        Criteria criteria = new Criteria();
        criteria.setName(dto.getName());
        criteria.setDescription(dto.getDescription());
        criteria.setActive(true);
        Criteria saved = criteriaRepository.save(criteria);
        return mapToDto(saved);
    }

    public CriteriaDto updateCriteria(Long id, CriteriaDto dto) {
        Criteria criteria = criteriaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Criteria not found"));
        criteria.setName(dto.getName());
        criteria.setDescription(dto.getDescription());
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
        return dto;
    }
}
