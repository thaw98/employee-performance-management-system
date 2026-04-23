package com.epms.backend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.audit.AuditActionType;
import com.epms.backend.audit.AuditTargetType;
import com.epms.backend.dto.movement.HomeDepartmentResponseDto;
import com.epms.backend.dto.movement.MovementHistoryResponseDto;
import com.epms.backend.dto.movement.PermanentTransferRequestDto;
import com.epms.backend.dto.movement.ReportingHistoryRequestDto;
import com.epms.backend.dto.movement.ReportingHistoryResponseDto;
import com.epms.backend.dto.movement.ReturnRequestDto;
import com.epms.backend.dto.movement.TemporaryTransferRequestDto;
import com.epms.backend.entity.Department;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.EmployeeDepartmentHistory;
import com.epms.backend.entity.EmployeeReportingHistory;
import com.epms.backend.entity.MovementType;
import com.epms.backend.entity.Position;
import com.epms.backend.repository.DepartmentRepository;
import com.epms.backend.repository.EmployeeDepartmentHistoryRepository;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.EmployeeReportingHistoryRepository;
import com.epms.backend.repository.PositionRepository;
import com.epms.backend.security.UserPrincipal;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmployeeMovementService {

    private static final List<MovementType> BASE_MOVEMENT_TYPES = List.of(
        MovementType.INITIAL,
        MovementType.PERMANENT_TRANSFER,
        MovementType.RETURN
    );

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final EmployeeDepartmentHistoryRepository historyRepository;
    private final EmployeeReportingHistoryRepository reportingHistoryRepository;
    private final AuditService auditService;

    // ── Temporary Transfer ──────────────────────────────────────────────────────

    @Transactional
    public MovementHistoryResponseDto temporaryTransfer(Long employeeId, TemporaryTransferRequestDto req, UserPrincipal actor) {
        Employee employee = requireEmployee(employeeId);
        Department toDept = requireActiveDepartment(req.getToDepartmentId());
        Position toPos = requirePositionInDepartment(req.getToPositionId(), toDept.getId());

        EmployeeDepartmentHistory current = requireCurrentMovement(employeeId);
        validateEffectiveDate(req.getEffectiveStartDate(), current.getEffectiveStartDate());

        // Cannot temporarily transfer if already on temporary assignment
        if (current.getMovementType() == MovementType.TEMPORARY) {
            throw new IllegalArgumentException("Employee is already on a temporary assignment. Return first before another temporary transfer.");
        }

        // Close previous row
        closeMovement(current, req.getEffectiveStartDate().minusDays(1));

        // Create TEMPORARY row
        EmployeeDepartmentHistory newRow = buildMovement(
            employee, current.getToDepartment(), toDept,
            current.getToPosition(), toPos,
            MovementType.TEMPORARY, req.getEffectiveStartDate(),
            req.getReason(), req.getRemarks(), actor.getId()
        );
        EmployeeDepartmentHistory saved = historyRepository.save(newRow);

        // Update employee current dept/pos
        employee.setDepartment(toDept);
        employee.setPosition(toPos);
        employeeRepository.save(employee);

        auditService.record(
            AuditActionType.EMPLOYEE_TEMPORARY_TRANSFER,
            AuditTargetType.EMPLOYEE,
            employeeId, actor.getId(), actor.getRoleId(),
            "Temporary transfer of employee " + employeeId + " to department " + toDept.getName(),
            buildMovementMeta(saved));

        return toDto(saved);
    }

    // ── Return ──────────────────────────────────────────────────────────────────

    @Transactional
    public MovementHistoryResponseDto returnFromTemporary(Long employeeId, ReturnRequestDto req, UserPrincipal actor) {
        Employee employee = requireEmployee(employeeId);
        EmployeeDepartmentHistory current = requireCurrentMovement(employeeId);

        if (current.getMovementType() != MovementType.TEMPORARY) {
            throw new IllegalArgumentException("Employee is not on a temporary assignment. Return is only valid after TEMPORARY transfer.");
        }

        Department homeDept = deriveHomeDepartmentEntity(employeeId)
            .orElseThrow(() -> new IllegalStateException("Cannot determine home department for employee " + employeeId));
        Position toPos = requirePositionInDepartment(req.getToPositionId(), homeDept.getId());

        validateEffectiveDate(req.getEffectiveStartDate(), current.getEffectiveStartDate());

        // Close TEMPORARY row
        closeMovement(current, req.getEffectiveStartDate().minusDays(1));

        // Create RETURN row
        EmployeeDepartmentHistory newRow = buildMovement(
            employee, current.getToDepartment(), homeDept,
            current.getToPosition(), toPos,
            MovementType.RETURN, req.getEffectiveStartDate(),
            req.getReason(), req.getRemarks(), actor.getId()
        );
        EmployeeDepartmentHistory saved = historyRepository.save(newRow);

        employee.setDepartment(homeDept);
        employee.setPosition(toPos);
        employeeRepository.save(employee);

        auditService.record(
            AuditActionType.EMPLOYEE_RETURN,
            AuditTargetType.EMPLOYEE,
            employeeId, actor.getId(), actor.getRoleId(),
            "Return of employee " + employeeId + " to home department " + homeDept.getName(),
            buildMovementMeta(saved));

        return toDto(saved);
    }

    // ── Permanent Transfer ──────────────────────────────────────────────────────

    @Transactional
    public MovementHistoryResponseDto permanentTransfer(Long employeeId, PermanentTransferRequestDto req, UserPrincipal actor) {
        Employee employee = requireEmployee(employeeId);
        Department toDept = requireActiveDepartment(req.getToDepartmentId());
        Position toPos = requirePositionInDepartment(req.getToPositionId(), toDept.getId());

        EmployeeDepartmentHistory current = requireCurrentMovement(employeeId);
        validateEffectiveDate(req.getEffectiveStartDate(), current.getEffectiveStartDate());

        // Close previous row
        closeMovement(current, req.getEffectiveStartDate().minusDays(1));

        // Create PERMANENT_TRANSFER row
        EmployeeDepartmentHistory newRow = buildMovement(
            employee, current.getToDepartment(), toDept,
            current.getToPosition(), toPos,
            MovementType.PERMANENT_TRANSFER, req.getEffectiveStartDate(),
            req.getReason(), req.getRemarks(), actor.getId()
        );
        EmployeeDepartmentHistory saved = historyRepository.save(newRow);

        employee.setDepartment(toDept);
        employee.setPosition(toPos);
        employeeRepository.save(employee);

        auditService.record(
            AuditActionType.EMPLOYEE_PERMANENT_TRANSFER,
            AuditTargetType.EMPLOYEE,
            employeeId, actor.getId(), actor.getRoleId(),
            "Permanent transfer of employee " + employeeId + " to department " + toDept.getName(),
            buildMovementMeta(saved));

        return toDto(saved);
    }

    // ── Queries ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<MovementHistoryResponseDto> getMovementHistory(Long employeeId) {
        requireEmployee(employeeId);
        return historyRepository.findByEmployee_IdOrderByEffectiveStartDateDesc(employeeId)
            .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<MovementHistoryResponseDto> getCurrentMovement(Long employeeId) {
        requireEmployee(employeeId);
        return historyRepository.findByEmployee_IdAndCurrentTrue(employeeId).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public HomeDepartmentResponseDto getHomeDepartment(Long employeeId) {
        requireEmployee(employeeId);
        EmployeeDepartmentHistory current = requireCurrentMovement(employeeId);

        if (current.getMovementType() != MovementType.TEMPORARY) {
            return HomeDepartmentResponseDto.builder()
                .departmentId(current.getToDepartment().getId())
                .departmentName(current.getToDepartment().getName())
                .derivedFrom(current.getMovementType().name())
                .build();
        }

        Department home = deriveHomeDepartmentEntity(employeeId)
            .orElseThrow(() -> new IllegalStateException("Cannot determine home department for employee " + employeeId));
        return HomeDepartmentResponseDto.builder()
            .departmentId(home.getId())
            .departmentName(home.getName())
            .derivedFrom("LATEST_BASE_MOVEMENT")
            .build();
    }

    // ── Reporting History ────────────────────────────────────────────────────────

    @Transactional
    public ReportingHistoryResponseDto assignManager(Long employeeId, ReportingHistoryRequestDto req, UserPrincipal actor) {
        Employee employee = requireEmployee(employeeId);
        Employee manager = requireEmployee(req.getManagerEmployeeId());

        if (employee.getId().equals(manager.getId())) {
            throw new IllegalArgumentException("An employee cannot be their own manager");
        }

        // Close current reporting row if exists
        reportingHistoryRepository.findByEmployee_IdAndCurrentTrue(employeeId).ifPresent(existing -> {
            existing.setCurrent(false);
            existing.setEffectiveEndDate(req.getEffectiveStartDate().minusDays(1));
            existing.setUpdatedOn(LocalDateTime.now());
            existing.setUpdatedBy(actor.getId());
            reportingHistoryRepository.save(existing);
        });

        EmployeeReportingHistory newRow = new EmployeeReportingHistory();
        newRow.setEmployee(employee);
        newRow.setManager(manager);
        newRow.setEffectiveStartDate(req.getEffectiveStartDate());
        newRow.setCurrent(true);
        newRow.setReason(req.getReason());
        newRow.setRemarks(req.getRemarks());
        newRow.setCreatedBy(actor.getId());
        newRow.setCreatedOn(LocalDateTime.now());
        EmployeeReportingHistory saved = reportingHistoryRepository.save(newRow);

        // Keep employee.manager in sync
        employee.setManager(manager);
        employeeRepository.save(employee);

        auditService.record(
            AuditActionType.EMPLOYEE_INFO_UPDATED,
            AuditTargetType.EMPLOYEE,
            employeeId, actor.getId(), actor.getRoleId(),
            "Manager assigned for employee " + employeeId + " -> manager " + manager.getId(),
            null);

        return toReportingDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ReportingHistoryResponseDto> getReportingHistory(Long employeeId) {
        requireEmployee(employeeId);
        return reportingHistoryRepository.findByEmployee_IdOrderByEffectiveStartDateDesc(employeeId)
            .stream().map(this::toReportingDto).collect(Collectors.toList());
    }

    // ── Home department derivation ───────────────────────────────────────────────

    /**
     * Derives the home department entity for an employee.
     * If current movement is TEMPORARY, looks up latest non-TEMPORARY base movement.
     */
    public Optional<Department> deriveHomeDepartmentEntity(Long employeeId) {
        Optional<EmployeeDepartmentHistory> currentOpt = historyRepository.findByEmployee_IdAndCurrentTrue(employeeId);
        if (currentOpt.isEmpty()) {
            return Optional.empty();
        }
        EmployeeDepartmentHistory current = currentOpt.get();
        if (current.getMovementType() != MovementType.TEMPORARY) {
            return Optional.of(current.getToDepartment());
        }
        List<EmployeeDepartmentHistory> baseMovements =
            historyRepository.findLatestBaseMovements(employeeId, BASE_MOVEMENT_TYPES);
        if (baseMovements.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(baseMovements.get(0).getToDepartment());
    }

    // ── Helpers ─────────────────────────────────────────────────────────────────

    private Employee requireEmployee(Long id) {
        return employeeRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + id));
    }

    private Department requireActiveDepartment(Long id) {
        Department dept = departmentRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Department not found: " + id));
        if (dept.getStatus() != null && "inactive".equalsIgnoreCase(dept.getStatus().trim())) {
            throw new IllegalArgumentException("Department is not active: " + dept.getName());
        }
        return dept;
    }

    private Position requirePositionInDepartment(Long posId, Long deptId) {
        Position pos = positionRepository.findByIdWithRoleAndDepartment(posId)
            .orElseThrow(() -> new IllegalArgumentException("Position not found: " + posId));
        if (pos.getDepartment() == null || !pos.getDepartment().getId().equals(deptId)) {
            throw new IllegalArgumentException("Position does not belong to the selected department");
        }
        return pos;
    }

    private EmployeeDepartmentHistory requireCurrentMovement(Long employeeId) {
        return historyRepository.findByEmployee_IdAndCurrentTrue(employeeId)
            .orElseThrow(() -> new IllegalStateException(
                "No active movement record found for employee " + employeeId +
                ". Employee may not have an INITIAL history row yet."));
    }

    private static void validateEffectiveDate(LocalDate newDate, LocalDate prevStartDate) {
        if (!newDate.isAfter(prevStartDate)) {
            throw new IllegalArgumentException(
                "Effective start date must be after the previous movement's start date (" + prevStartDate + ")");
        }
    }

    private void closeMovement(EmployeeDepartmentHistory row, LocalDate endDate) {
        row.setCurrent(false);
        row.setEffectiveEndDate(endDate);
        row.setUpdatedOn(LocalDateTime.now());
        historyRepository.save(row);
    }

    private EmployeeDepartmentHistory buildMovement(
            Employee employee, Department fromDept, Department toDept,
            Position fromPos, Position toPos,
            MovementType type, LocalDate startDate,
            String reason, String remarks, Long createdBy) {
        EmployeeDepartmentHistory row = new EmployeeDepartmentHistory();
        row.setEmployee(employee);
        row.setFromDepartment(fromDept);
        row.setToDepartment(toDept);
        row.setFromPosition(fromPos);
        row.setToPosition(toPos);
        row.setMovementType(type);
        row.setEffectiveStartDate(startDate);
        row.setCurrent(true);
        row.setReason(reason);
        row.setRemarks(remarks);
        row.setCreatedBy(createdBy);
        row.setCreatedOn(LocalDateTime.now());
        return row;
    }

    private String buildMovementMeta(EmployeeDepartmentHistory h) {
        return "{\"movementHistoryId\":%d,\"movementType\":\"%s\",\"toDepartmentId\":%d}"
            .formatted(h.getId(), h.getMovementType(), h.getToDepartment().getId());
    }

    private MovementHistoryResponseDto toDto(EmployeeDepartmentHistory h) {
        return MovementHistoryResponseDto.builder()
            .id(h.getId())
            .employeeId(h.getEmployee().getId())
            .movementType(h.getMovementType().name())
            .fromDepartmentId(h.getFromDepartment() != null ? h.getFromDepartment().getId() : null)
            .fromDepartmentName(h.getFromDepartment() != null ? h.getFromDepartment().getName() : null)
            .toDepartmentId(h.getToDepartment().getId())
            .toDepartmentName(h.getToDepartment().getName())
            .fromPositionId(h.getFromPosition() != null ? h.getFromPosition().getId() : null)
            .fromPositionName(h.getFromPosition() != null ? h.getFromPosition().getName() : null)
            .toPositionId(h.getToPosition().getId())
            .toPositionName(h.getToPosition().getName())
            .effectiveStartDate(h.getEffectiveStartDate())
            .effectiveEndDate(h.getEffectiveEndDate())
            .isCurrent(h.isCurrent())
            .reason(h.getReason())
            .remarks(h.getRemarks())
            .build();
    }

    private ReportingHistoryResponseDto toReportingDto(EmployeeReportingHistory h) {
        return ReportingHistoryResponseDto.builder()
            .id(h.getId())
            .employeeId(h.getEmployee().getId())
            .managerEmployeeId(h.getManager().getId())
            .managerName(h.getManager().getEmployeeName())
            .effectiveStartDate(h.getEffectiveStartDate())
            .effectiveEndDate(h.getEffectiveEndDate())
            .isCurrent(h.isCurrent())
            .reason(h.getReason())
            .remarks(h.getRemarks())
            .build();
    }
}
