package com.epms.backend.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

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
import com.epms.backend.entity.DepartmentManagerHistory;
import com.epms.backend.entity.Employee;
import com.epms.backend.repository.DepartmentManagerHistoryRepository;
import com.epms.backend.repository.DepartmentRepository;
import com.epms.backend.repository.EmployeeRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final DepartmentManagerHistoryRepository departmentManagerHistoryRepository;
    private final EmployeeRepository employeeRepository;
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

        Long requestedManagerId = request.getManagerId();
        if (requestedManagerId != null && !employeeRepository.existsById(requestedManagerId)) {
            throw new IllegalArgumentException("Manager employee not found.");
        }

        Department department = new Department();
        department.setCode(code);
        department.setName(name);
        department.setManagerId(requestedManagerId);
        department.setStatus(request.getStatus() != null ? normalizeStatus(request.getStatus()) : STATUS_ACTIVE);
        department.setCreatedDate(Instant.now());
        department.setUpdatedDate(Instant.now());

        Department saved = departmentRepository.save(department);
        syncDepartmentManagerHistory(saved, null, saved.getManagerId(), null);
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

        Long requestedManagerId = request.getManagerId();
        if (requestedManagerId != null && !employeeRepository.existsById(requestedManagerId)) {
            throw new IllegalArgumentException("Manager employee not found.");
        }

        Long previousManagerId = department.getManagerId();

        department.setCode(code);
        department.setName(name);
        department.setManagerId(requestedManagerId);
        department.setStatus(normalizeStatus(request.getStatus()));
        department.setUpdatedDate(Instant.now());

        Department saved = departmentRepository.save(department);
        syncDepartmentManagerHistory(saved, previousManagerId, saved.getManagerId(), null);
        return mapToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ManagerOptionDto> getAllManagers(Long departmentId) {
        String sql = """
                SELECT
                    e.employee_id,
                    e.full_name,
                    e.staff_no,
                    COALESCE(d.department_name, '') AS department_name,
                    COALESCE(p.position_name, '') AS position_name
                FROM employee e
                LEFT JOIN user_account u ON e.employee_id = u.employee_id
                LEFT JOIN department d ON e.department_id = d.department_id
                LEFT JOIN position p ON e.position_id = p.position_id
                WHERE (
                    EXISTS (
                        SELECT 1
                        FROM department current_department
                        WHERE current_department.department_id = ?
                            AND current_department.manager_id = e.employee_id
                    )
                    OR (
                        e.employment_status = 'ACTIVE'
                        AND (
                            u.role_id = 2
                            OR EXISTS (
                                SELECT 1
                                FROM department assigned
                                WHERE assigned.manager_id = e.employee_id
                            )
                        )
                        AND (
                            NOT EXISTS (
                                SELECT 1
                                FROM department assigned_department
                                WHERE assigned_department.manager_id = e.employee_id
                            )
                            OR EXISTS (
                                SELECT 1
                                FROM department current_department
                                WHERE current_department.department_id = ?
                                    AND current_department.manager_id = e.employee_id
                            )
                        )
                    )
                )
                ORDER BY e.full_name ASC
                """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> new ManagerOptionDto(
                rs.getLong("employee_id"),
                rs.getString("full_name"),
                rs.getString("staff_no"),
                rs.getString("department_name"),
                rs.getString("position_name")), departmentId, departmentId);
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

    /**
     * Closes open {@code department_manager_history} rows when {@code department.manager_id} changes,
     * and opens a new row when a new manager is set.
     */
    private void syncDepartmentManagerHistory(
            Department department,
            Long previousManagerId,
            Long newManagerId,
            Long createdBy) {
        if (Objects.equals(previousManagerId, newManagerId)) {
            return;
        }
        LocalDate today = LocalDate.now();
        for (DepartmentManagerHistory open : departmentManagerHistoryRepository.findByDepartment_IdAndEndDateIsNull(
                department.getId())) {
            open.setEndDate(today.minusDays(1));
            departmentManagerHistoryRepository.save(open);
        }
        if (newManagerId == null) {
            return;
        }
        Employee mgr = employeeRepository.findById(newManagerId)
                .orElseThrow(() -> new IllegalArgumentException("Manager employee not found."));
        DepartmentManagerHistory row = new DepartmentManagerHistory();
        row.setDepartment(department);
        row.setManager(mgr);
        row.setStartDate(today);
        row.setEndDate(null);
        row.setCreatedBy(createdBy);
        row.setCreatedOn(LocalDateTime.now());
        departmentManagerHistoryRepository.save(row);
    }
}
