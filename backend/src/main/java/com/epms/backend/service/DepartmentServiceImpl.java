package com.epms.backend.service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.dto.department.CreateDepartmentRequest;
import com.epms.backend.dto.department.DepartmentDto;
import com.epms.backend.dto.department.UpdateDepartmentRequest;
import com.epms.backend.entity.Department;
import com.epms.backend.repository.DepartmentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;

    private static final String STATUS_ACTIVE = "Active";
    private static final String STATUS_INACTIVE = "Inactive";

    @Override
    public List<DepartmentDto> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public DepartmentDto createDepartment(CreateDepartmentRequest request) {
        String code = request.getDepartmentCode().trim();
        String name = request.getDepartmentName().trim();

        if (departmentRepository.existsByCodeIgnoreCase(code)) {
            throw new IllegalArgumentException("Department code already exists.");
        }

        if (departmentRepository.existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException("Department name already exists.");
        }

        Department department = new Department();
        department.setCode(code);
        department.setName(name);
        department.setStatus(request.getStatus() != null ? normalizeStatus(request.getStatus()) : STATUS_ACTIVE);
        department.setCreatedDate(Instant.now());
        department.setUpdatedDate(Instant.now());

        Department saved = departmentRepository.save(department);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public DepartmentDto updateDepartment(Long id, UpdateDepartmentRequest request) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Department not found."));

        String code = request.getDepartmentCode().trim();
        String name = request.getDepartmentName().trim();

        if (departmentRepository.existsByCodeIgnoreCaseAndIdNot(code, id)) {
            throw new IllegalArgumentException("Department code already exists.");
        }

        if (departmentRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new IllegalArgumentException("Department name already exists.");
        }

        department.setCode(code);
        department.setName(name);
        department.setStatus(normalizeStatus(request.getStatus()));
        department.setUpdatedDate(Instant.now());

        Department saved = departmentRepository.save(department);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public void disbandDepartment(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Department not found."));
        
        department.setStatus(STATUS_INACTIVE);
        department.setUpdatedDate(Instant.now());
        departmentRepository.save(department);
    }

    private String normalizeStatus(String status) {
        String normalized = status == null ? "" : status.trim();
        if ("active".equalsIgnoreCase(normalized)) {
            return STATUS_ACTIVE;
        }
        if ("inactive".equalsIgnoreCase(normalized)) {
            return STATUS_INACTIVE;
        }
        throw new IllegalArgumentException("Status must be Active or Inactive.");
    }

    private DepartmentDto mapToDto(Department department) {
        return DepartmentDto.builder()
                .departmentId(department.getId())
                .departmentCode(department.getCode())
                .departmentName(department.getName())
                .status(department.getStatus())
                .createdDate(department.getCreatedDate())
                .updatedDate(department.getUpdatedDate())
                .build();
    }
}
