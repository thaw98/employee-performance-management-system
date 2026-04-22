package com.epms.backend.service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.epms.backend.dto.hr.DepartmentCreateDto;
import com.epms.backend.dto.hr.DepartmentDto;
import com.epms.backend.dto.hr.DepartmentUpdateDto;
import com.epms.backend.entity.Department;
import com.epms.backend.repository.DepartmentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    private static final String STATUS_DELETED = "DELETED";
    private static final String STATUS_ACTIVE = "ACTIVE";

    public List<DepartmentDto> getAllDepartments() {
        return departmentRepository.findByStatusNotOrderByNameAsc(STATUS_DELETED)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public DepartmentDto createDepartment(DepartmentCreateDto dto) {
        if (dto.getDepartmentCode() == null || dto.getDepartmentCode().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department code is required.");
        }
        if (dto.getDepartmentName() == null || dto.getDepartmentName().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department name is required.");
        }

        String code = dto.getDepartmentCode().trim();
        String name = dto.getDepartmentName().trim();

        if (departmentRepository.existsByCodeIgnoreCaseAndStatusNot(code, STATUS_DELETED)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Department code already exists.");
        }
        if (departmentRepository.existsByNameIgnoreCaseAndStatusNot(name, STATUS_DELETED)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Department name already exists.");
        }

        Department dept = new Department();
        dept.setCode(code);
        dept.setName(name);
        dept.setStatus(dto.getStatus() == null || dto.getStatus().trim().isEmpty() ? STATUS_ACTIVE : dto.getStatus().trim());
        dept.setCreatedDate(Instant.now());
        dept.setUpdatedDate(Instant.now());

        return mapToDto(departmentRepository.save(dept));
    }

    @Transactional
    public DepartmentDto updateDepartment(Long id, DepartmentUpdateDto dto) {
        if (dto.getDepartmentCode() == null || dto.getDepartmentCode().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department code is required.");
        }
        if (dto.getDepartmentName() == null || dto.getDepartmentName().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department name is required.");
        }

        String code = dto.getDepartmentCode().trim();
        String name = dto.getDepartmentName().trim();

        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found"));

        if (departmentRepository.existsByCodeIgnoreCaseAndIdNotAndStatusNot(code, id, STATUS_DELETED)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Department code already exists.");
        }
        if (departmentRepository.existsByNameIgnoreCaseAndIdNotAndStatusNot(name, id, STATUS_DELETED)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Department name already exists.");
        }

        dept.setCode(code);
        dept.setName(name);
        if (dto.getStatus() != null && !dto.getStatus().trim().isEmpty()) {
            dept.setStatus(dto.getStatus().trim());
        }
        dept.setUpdatedDate(Instant.now());

        return mapToDto(departmentRepository.save(dept));
    }

    @Transactional
    public DepartmentDto disbandDepartment(Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found"));
        
        dept.setStatus(STATUS_DELETED);
        dept.setUpdatedDate(Instant.now());

        return mapToDto(departmentRepository.save(dept));
    }

    private DepartmentDto mapToDto(Department dept) {
        return DepartmentDto.builder()
                .departmentId(dept.getId())
                .departmentCode(dept.getCode())
                .departmentName(dept.getName())
                .status(dept.getStatus())
                .build();
    }
}
