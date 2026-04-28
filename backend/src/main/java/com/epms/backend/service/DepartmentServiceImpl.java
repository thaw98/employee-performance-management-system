package com.epms.backend.service;

import java.time.Instant;
import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
    private final JdbcTemplate jdbcTemplate;

    private static final String STATUS_ACTIVE = "Active";
    private static final String STATUS_INACTIVE = "Inactive";

    @Override
    public List<DepartmentDto> getAllDepartments() {
        return jdbcTemplate.query("""
                SELECT
                    d.department_id,
                    d.department_code,
                    d.department_name,
                    d.status,
                    d.created_date,
                    d.updated_date,
                    d.manager_id,
                    e.full_name AS manager_name
                FROM department d
                LEFT JOIN employee e ON e.employee_id = d.manager_id
                ORDER BY d.department_id ASC
                """, (rs, rowNum) -> DepartmentDto.builder()
                .departmentId(rs.getLong("department_id"))
                .departmentCode(rs.getString("department_code"))
                .departmentName(rs.getString("department_name"))
                .status(rs.getString("status"))
                .createdDate(rs.getTimestamp("created_date") == null ? null : rs.getTimestamp("created_date").toInstant())
                .updatedDate(rs.getTimestamp("updated_date") == null ? null : rs.getTimestamp("updated_date").toInstant())
                .managerId(rs.getObject("manager_id", Long.class))
                .managerName(rs.getString("manager_name"))
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public DepartmentDto getDepartmentById(Long id) {
        return departmentRepository.findById(id)
                .map(this::mapToDto)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found."));
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
        department.setManagerId(validateManager(request.getManagerId()));
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
        department.setManagerId(validateManager(request.getManagerId()));
        department.setUpdatedDate(Instant.now());

        Department saved = departmentRepository.save(department);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public void deleteDepartment(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Department not found."));

        try {
            departmentRepository.delete(department);
            departmentRepository.flush();
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException(
                    "Department cannot be deleted because it is still referenced by other records.");
        }
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
        Long managerId = department.getManagerId();
        return DepartmentDto.builder()
                .departmentId(department.getId())
                .departmentCode(department.getCode())
                .departmentName(department.getName())
                .status(department.getStatus())
                .createdDate(department.getCreatedDate())
                .updatedDate(department.getUpdatedDate())
                .managerId(managerId)
                .managerName(managerId == null ? null : departmentRepository.findManagerNameById(managerId).orElse(null))
                .build();
    }

    private Long validateManager(Long managerId) {
        if (managerId == null) {
            throw new IllegalArgumentException("Manager is required.");
        }
        departmentRepository.findManagerNameById(managerId)
                .orElseThrow(() -> new IllegalArgumentException("Manager must be a Department Head."));
        return managerId;
    }
}
