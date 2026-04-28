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
import com.epms.backend.dto.department.ManagerOptionDto;
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
                    department_id,
                    department_code,
                    department_name,
                    status,
                    manager_id,
                    manager_name,
                    created_date,
                    updated_date
                FROM (
                    SELECT
                        d.department_id,
                        d.department_code,
                        d.department_name,
                        d.status,
                        d.manager_id,
                        e.full_name AS manager_name,
                        d.created_date,
                        d.updated_date
                    FROM department d
                    LEFT JOIN employee e ON d.manager_id = e.employee_id
                ) departments
                ORDER BY department_id ASC
                """, (rs, rowNum) -> DepartmentDto.builder()
                .departmentId(rs.getLong("department_id"))
                .departmentCode(rs.getString("department_code"))
                .departmentName(rs.getString("department_name"))
                .status(rs.getString("status"))
                .managerId(rs.getObject("manager_id", Long.class))
                .managerName(rs.getString("manager_name"))
                .createdDate(rs.getTimestamp("created_date") == null ? null : rs.getTimestamp("created_date").toInstant())
                .updatedDate(rs.getTimestamp("updated_date") == null ? null : rs.getTimestamp("updated_date").toInstant())
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
        department.setManagerId(request.getManagerId());
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
        department.setManagerId(request.getManagerId());
        department.setStatus(normalizeStatus(request.getStatus()));
        department.setUpdatedDate(Instant.now());

        Department saved = departmentRepository.save(department);
        return mapToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ManagerOptionDto> getAllManagers() {
        String sql = """
                SELECT
                    e.employee_id,
                    e.full_name,
                    e.staff_no,
                    COALESCE(d.department_name, '') AS department_name,
                    COALESCE(p.position_name, '') AS position_name
                FROM employee e
                INNER JOIN user_account u ON e.employee_id = u.employee_id
                LEFT JOIN department d ON e.department_id = d.department_id
                LEFT JOIN position p ON e.position_id = p.position_id
                WHERE u.role_id = 2
                    AND e.employment_status = 'ACTIVE'
                ORDER BY e.full_name ASC
                """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> new ManagerOptionDto(
                rs.getLong("employee_id"),
                rs.getString("full_name"),
                rs.getString("staff_no"),
                rs.getString("department_name"),
                rs.getString("position_name")));
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
        return DepartmentDto.builder()
                .departmentId(department.getId())
                .departmentCode(department.getCode())
                .departmentName(department.getName())
                .status(department.getStatus())
                .managerId(department.getManagerId())
                .managerName(getManagerName(department.getManagerId()))
                .createdDate(department.getCreatedDate())
                .updatedDate(department.getUpdatedDate())
                .build();
    }

    private String getManagerName(Long managerId) {
        if (managerId == null) {
            return null;
        }
        String sql = "SELECT full_name FROM employee WHERE employee_id = ?";
        try {
            return jdbcTemplate.queryForObject(sql, String.class, managerId);
        } catch (Exception e) {
            return null;
        }
    }
}
