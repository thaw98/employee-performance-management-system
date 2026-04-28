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
    private static final long DEPARTMENT_MANAGER_ROLE_ID = 2L;

    private static final String DEPARTMENT_SELECT = """
            SELECT
                d.department_id,
                d.department_code,
                d.department_name,
                d.status,
                d.created_date,
                d.updated_date,
                (
                    SELECT m.employee_id
                    FROM employee m
                    INNER JOIN user_account u ON m.employee_id = u.employee_id
                    WHERE u.role_id = 2
                        AND m.employment_status = 'ACTIVE'
                        AND m.department_id = d.department_id
                    ORDER BY m.employee_id
                    LIMIT 1
                ) AS manager_id,
                (
                    SELECT m.full_name
                    FROM employee m
                    INNER JOIN user_account u ON m.employee_id = u.employee_id
                    WHERE u.role_id = 2
                        AND m.employment_status = 'ACTIVE'
                        AND m.department_id = d.department_id
                    ORDER BY m.employee_id
                    LIMIT 1
                ) AS manager_name,
                (
                    SELECT m.staff_no
                    FROM employee m
                    INNER JOIN user_account u ON m.employee_id = u.employee_id
                    WHERE u.role_id = 2
                        AND m.employment_status = 'ACTIVE'
                        AND m.department_id = d.department_id
                    ORDER BY m.employee_id
                    LIMIT 1
                ) AS manager_staff_no
            FROM department d
            """;

    @Override
    public List<DepartmentDto> getAllDepartments() {
        return jdbcTemplate.query(DEPARTMENT_SELECT + " ORDER BY d.department_id ASC", this::mapDepartmentRow);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ManagerOptionDto> getManagerOptions() {
        return jdbcTemplate.query("""
                SELECT
                    e.employee_id,
                    e.full_name,
                    e.staff_no,
                    e.email,
                    e.phone_number,
                    e.department_id,
                    d.department_name,
                    d.department_code,
                    p.position_name,
                    p.position_code,
                    u.user_id,
                    r.role_name
                FROM employee e
                INNER JOIN user_account u ON e.employee_id = u.employee_id
                INNER JOIN role r ON u.role_id = r.id
                LEFT JOIN department d ON e.department_id = d.department_id
                LEFT JOIN position p ON e.position_id = p.position_id
                WHERE u.role_id = 2
                    AND e.employment_status = 'ACTIVE'
                ORDER BY e.full_name ASC, e.employee_id ASC
                """, (rs, rowNum) -> ManagerOptionDto.builder()
                .employeeId(rs.getLong("employee_id"))
                .fullName(rs.getString("full_name"))
                .staffNo(rs.getString("staff_no"))
                .email(rs.getString("email"))
                .phoneNumber(rs.getString("phone_number"))
                .departmentId(getNullableLong(rs, "department_id"))
                .departmentName(rs.getString("department_name"))
                .departmentCode(rs.getString("department_code"))
                .positionName(rs.getString("position_name"))
                .positionCode(rs.getString("position_code"))
                .userId(rs.getLong("user_id"))
                .roleName(rs.getString("role_name"))
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public DepartmentDto getDepartmentById(Long id) {
        List<DepartmentDto> rows = jdbcTemplate.query(
                DEPARTMENT_SELECT + " WHERE d.department_id = ?",
                this::mapDepartmentRow,
                id);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found.");
        }
        return rows.get(0);
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
        syncDepartmentManager(saved.getId(), request.getManagerId());
        return getDepartmentById(saved.getId());
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
        syncDepartmentManager(saved.getId(), request.getManagerId());
        return getDepartmentById(saved.getId());
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
                .createdDate(department.getCreatedDate())
                .updatedDate(department.getUpdatedDate())
                .build();
    }

    private DepartmentDto mapDepartmentRow(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        return DepartmentDto.builder()
                .departmentId(rs.getLong("department_id"))
                .departmentCode(rs.getString("department_code"))
                .departmentName(rs.getString("department_name"))
                .status(rs.getString("status"))
                .createdDate(rs.getTimestamp("created_date") == null ? null : rs.getTimestamp("created_date").toInstant())
                .updatedDate(rs.getTimestamp("updated_date") == null ? null : rs.getTimestamp("updated_date").toInstant())
                .managerId(getNullableLong(rs, "manager_id"))
                .managerName(rs.getString("manager_name"))
                .managerStaffNo(rs.getString("manager_staff_no"))
                .build();
    }

    private Long getNullableLong(java.sql.ResultSet rs, String columnName) throws java.sql.SQLException {
        Long value = rs.getLong(columnName);
        return rs.wasNull() ? null : value;
    }

    private void syncDepartmentManager(Long departmentId, Long managerId) {
        if (managerId != null) {
            Integer managerCount = jdbcTemplate.queryForObject("""
                    SELECT COUNT(*)
                    FROM employee e
                    INNER JOIN user_account u ON e.employee_id = u.employee_id
                    WHERE e.employee_id = ?
                        AND u.role_id = ?
                        AND e.employment_status = 'ACTIVE'
                    """, Integer.class, managerId, DEPARTMENT_MANAGER_ROLE_ID);
            if (managerCount == null || managerCount == 0) {
                throw new IllegalArgumentException("Selected manager must be an active Department Manager.");
            }
        }

        if (managerId == null) {
            jdbcTemplate.update("""
                    UPDATE employee e
                    INNER JOIN user_account u ON e.employee_id = u.employee_id
                    SET e.department_id = NULL
                    WHERE e.department_id = ?
                        AND u.role_id = ?
                    """, departmentId, DEPARTMENT_MANAGER_ROLE_ID);
            return;
        }

        jdbcTemplate.update("""
                UPDATE employee e
                INNER JOIN user_account u ON e.employee_id = u.employee_id
                SET e.department_id = NULL
                WHERE e.department_id = ?
                    AND u.role_id = ?
                    AND e.employee_id <> ?
                """, departmentId, DEPARTMENT_MANAGER_ROLE_ID, managerId);

        jdbcTemplate.update("UPDATE employee SET department_id = ? WHERE employee_id = ?", departmentId, managerId);
    }
}
