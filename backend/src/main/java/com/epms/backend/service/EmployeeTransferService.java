package com.epms.backend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.audit.AuditActionType;
import com.epms.backend.audit.AuditTargetType;
import com.epms.backend.dto.transfer.HomeDepartmentResponseDto;
import com.epms.backend.dto.transfer.MakePermanentRequestDto;
import com.epms.backend.dto.transfer.PermanentTransferRequestDto;
import com.epms.backend.dto.transfer.ReportingHistoryRequestDto;
import com.epms.backend.dto.transfer.ReportingHistoryResponseDto;
import com.epms.backend.dto.transfer.ReturnRequestDto;
import com.epms.backend.dto.transfer.TemporaryTransferRequestDto;
import com.epms.backend.dto.transfer.TransferHistoryResponseDto;
import com.epms.backend.entity.Department;
import com.epms.backend.entity.DepartmentPosition;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.EmployeeDepartmentHistory;
import com.epms.backend.entity.EmployeeReportingHistory;
import com.epms.backend.entity.Position;
import com.epms.backend.entity.TransferType;
import com.epms.backend.repository.DepartmentPositionRepository;
import com.epms.backend.repository.DepartmentRepository;
import com.epms.backend.repository.EmployeeDepartmentHistoryRepository;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.EmployeeReportingHistoryRepository;
import com.epms.backend.repository.PositionRepository;
import com.epms.backend.security.UserPrincipal;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmployeeTransferService {

    public static final long AUDIT_SYSTEM_ACTOR_ID = 0L;
    private static final String NOTIFICATION_SOURCE = "TRANSFER";
    private static final DateTimeFormatter TRANSFER_DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private static final List<TransferType> BASE_TRANSFER_TYPES = List.of(
        TransferType.INITIAL,
        TransferType.PERMANENT_TRANSFER,
        TransferType.RETURN
    );

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final DepartmentPositionRepository departmentPositionRepository;
    private final PositionRepository positionRepository;
    private final EmployeeDepartmentHistoryRepository historyRepository;
    private final EmployeeReportingHistoryRepository reportingHistoryRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    @Transactional
    public TransferHistoryResponseDto temporaryTransfer(Long employeeId, TemporaryTransferRequestDto req, UserPrincipal actor) {
        Employee employee = requireEmployee(employeeId);
        Department toDept = requireActiveDepartment(req.getToDepartmentId());
        Position toPos = requirePositionInDepartment(req.getToPositionId(), toDept.getId());

        EmployeeDepartmentHistory current = requireCurrentTransfer(employeeId);
        validateEffectiveDate(req.getEffectiveStartDate(), current.getEffectiveStartDate());
        validateTemporaryEndDate(req.getEffectiveStartDate(), req.getEffectiveEndDate());

        if (current.getTransferType() == TransferType.TEMPORARY) {
            throw new IllegalArgumentException("Employee is already on a temporary assignment. Return first before another temporary transfer.");
        }

        closeTransfer(current, req.getEffectiveStartDate().minusDays(1), actor.getId());

        EmployeeDepartmentHistory newRow = buildTransfer(
            employee, current.getToDepartment(), toDept,
            current.getToPosition(), toPos,
            TransferType.TEMPORARY, req.getEffectiveStartDate(), req.getEffectiveEndDate(),
            req.getReason(), req.getRemarks(), actor.getId()
        );
        EmployeeDepartmentHistory saved = historyRepository.save(newRow);

        employee.setDepartment(toDept);
        employee.setPosition(toPos);
        employeeRepository.save(employee);

        sendTemporaryTransferNotification(employee, toDept, toPos, req.getEffectiveStartDate(), req.getEffectiveEndDate());

        auditService.record(
            AuditActionType.EMPLOYEE_TEMPORARY_TRANSFER,
            AuditTargetType.EMPLOYEE,
            employeeId, actor.getId(), actor.getRoleId(),
            "Temporary transfer of employee " + employeeId + " to department " + toDept.getName(),
            buildTransferMeta(saved));

        return toDto(saved);
    }

    @Transactional
    public TransferHistoryResponseDto returnFromTemporary(Long employeeId, ReturnRequestDto req, UserPrincipal actor) {
        return returnFromTemporary(employeeId, req, actor, actor.getId(), actor.getRoleId());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public TransferHistoryResponseDto autoReturnExpiredTemporary(Long temporaryHistoryId) {
        EmployeeDepartmentHistory temporary = historyRepository.findById(temporaryHistoryId)
            .orElseThrow(() -> new IllegalArgumentException("Transfer history not found: " + temporaryHistoryId));
        if (!temporary.isCurrent() || temporary.getTransferType() != TransferType.TEMPORARY) {
            throw new IllegalArgumentException("Transfer history row is not an active temporary assignment");
        }
        if (temporary.getEffectiveEndDate() == null || !temporary.getEffectiveEndDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Temporary assignment has not expired");
        }

        ReturnRequestDto req = new ReturnRequestDto();
        HomePlacement homePlacement = deriveHomePlacement(temporary.getEmployee().getId())
            .orElseThrow(() -> new IllegalStateException("Cannot determine home placement for employee " + temporary.getEmployee().getId()));
        req.setToPositionId(homePlacement.position().getId());
        req.setEffectiveStartDate(temporary.getEffectiveEndDate().plusDays(1));
        req.setReason("Auto-return: temporary assignment ended on " + temporary.getEffectiveEndDate());
        req.setRemarks(null);

        return returnFromTemporary(
            temporary.getEmployee().getId(),
            req,
            null,
            AUDIT_SYSTEM_ACTOR_ID,
            null);
    }

    private TransferHistoryResponseDto returnFromTemporary(
            Long employeeId,
            ReturnRequestDto req,
            UserPrincipal actor,
            Long auditActorId,
            Long auditRoleId) {
        Employee employee = requireEmployee(employeeId);
        EmployeeDepartmentHistory current = requireCurrentTransfer(employeeId);

        if (current.getTransferType() != TransferType.TEMPORARY) {
            throw new IllegalArgumentException("Employee is not on a temporary assignment. Return is only valid after TEMPORARY transfer.");
        }

        HomePlacement homePlacement = deriveHomePlacement(employeeId)
            .orElseThrow(() -> new IllegalStateException("Cannot determine home placement for employee " + employeeId));
        Department homeDept = homePlacement.department();
        Position toPos = requirePositionInDepartment(req.getToPositionId(), homeDept.getId());

        validateEffectiveDate(req.getEffectiveStartDate(), current.getEffectiveStartDate());

        closeTransfer(current, req.getEffectiveStartDate().minusDays(1), auditActorId);

        EmployeeDepartmentHistory newRow = buildTransfer(
            employee, current.getToDepartment(), homeDept,
            current.getToPosition(), toPos,
            TransferType.RETURN, req.getEffectiveStartDate(), null,
            req.getReason(), req.getRemarks(), auditActorId
        );
        EmployeeDepartmentHistory saved = historyRepository.save(newRow);

        employee.setDepartment(homeDept);
        employee.setPosition(toPos);
        employeeRepository.save(employee);

        auditService.record(
            AuditActionType.EMPLOYEE_RETURN,
            AuditTargetType.EMPLOYEE,
            employeeId, auditActorId, auditRoleId,
            actor == null
                ? "Auto-return of employee " + employeeId + " to home department " + homeDept.getName()
                : "Return of employee " + employeeId + " to home department " + homeDept.getName(),
            buildTransferMeta(saved));

        return toDto(saved);
    }

    @Transactional
    public TransferHistoryResponseDto permanentTransfer(Long employeeId, PermanentTransferRequestDto req, UserPrincipal actor) {
        Employee employee = requireEmployee(employeeId);
        Department toDept = requireActiveDepartment(req.getToDepartmentId());
        Position toPos = requirePositionInDepartment(req.getToPositionId(), toDept.getId());

        EmployeeDepartmentHistory current = requireCurrentTransfer(employeeId);
        validateEffectiveDate(req.getEffectiveStartDate(), current.getEffectiveStartDate());

        closeTransfer(current, req.getEffectiveStartDate().minusDays(1), actor.getId());

        EmployeeDepartmentHistory newRow = buildTransfer(
            employee, current.getToDepartment(), toDept,
            current.getToPosition(), toPos,
            TransferType.PERMANENT_TRANSFER, req.getEffectiveStartDate(), null,
            req.getReason(), req.getRemarks(), actor.getId()
        );
        EmployeeDepartmentHistory saved = historyRepository.save(newRow);

        employee.setDepartment(toDept);
        employee.setPosition(toPos);
        employeeRepository.save(employee);

        sendPermanentTransferNotification(employee, toDept, toPos, req.getEffectiveStartDate());

        auditService.record(
            AuditActionType.EMPLOYEE_PERMANENT_TRANSFER,
            AuditTargetType.EMPLOYEE,
            employeeId, actor.getId(), actor.getRoleId(),
            "Permanent transfer of employee " + employeeId + " to department " + toDept.getName(),
            buildTransferMeta(saved));

        return toDto(saved);
    }

    @Transactional
    public TransferHistoryResponseDto makePermanent(Long employeeId, MakePermanentRequestDto req, UserPrincipal actor) {
        Employee employee = requireEmployee(employeeId);
        EmployeeDepartmentHistory current = requireCurrentTransfer(employeeId);
        if (current.getTransferType() != TransferType.TEMPORARY) {
            throw new IllegalArgumentException("Employee is not on a temporary assignment");
        }
        if (current.getEffectiveEndDate() == null) {
            throw new IllegalArgumentException("Temporary assignment end date is required before making permanent");
        }
        if (req.getEffectiveStartDate().isBefore(current.getEffectiveStartDate())
                || req.getEffectiveStartDate().isAfter(current.getEffectiveEndDate())) {
            throw new IllegalArgumentException("Effective start date must be within the temporary assignment date range");
        }

        closeTransfer(current, req.getEffectiveStartDate().minusDays(1), actor.getId());

        EmployeeDepartmentHistory newRow = buildTransfer(
            employee, current.getFromDepartment(), current.getToDepartment(),
            current.getFromPosition(), current.getToPosition(),
            TransferType.PERMANENT_TRANSFER, req.getEffectiveStartDate(), null,
            req.getReason(), req.getRemarks(), actor.getId()
        );
        EmployeeDepartmentHistory saved = historyRepository.save(newRow);

        employee.setDepartment(current.getToDepartment());
        employee.setPosition(current.getToPosition());
        employeeRepository.save(employee);

        sendMakePermanentNotification(employee, current.getToDepartment(), current.getToPosition(), req.getEffectiveStartDate());

        auditService.record(
            AuditActionType.EMPLOYEE_PERMANENT_TRANSFER,
            AuditTargetType.EMPLOYEE,
            employeeId, actor.getId(), actor.getRoleId(),
            "Temporary transfer of employee " + employeeId + " made permanent",
            buildTransferMeta(saved));

        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<TransferHistoryResponseDto> getTransferHistory(Long employeeId) {
        requireEmployee(employeeId);
        return historyRepository.findByEmployee_IdOrderByEffectiveStartDateDesc(employeeId)
            .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<TransferHistoryResponseDto> getCurrentTransfer(Long employeeId) {
        requireEmployee(employeeId);
        return historyRepository.findByEmployee_IdAndCurrentTrue(employeeId).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public HomeDepartmentResponseDto getHomeDepartment(Long employeeId) {
        requireEmployee(employeeId);
        EmployeeDepartmentHistory current = requireCurrentTransfer(employeeId);

        if (current.getTransferType() != TransferType.TEMPORARY) {
            return HomeDepartmentResponseDto.builder()
                .departmentId(current.getToDepartment().getId())
                .departmentName(current.getToDepartment().getName())
                .derivedFrom(current.getTransferType().name())
                .build();
        }

        HomePlacement home = deriveHomePlacement(employeeId)
            .orElseThrow(() -> new IllegalStateException("Cannot determine home department for employee " + employeeId));
        return HomeDepartmentResponseDto.builder()
            .departmentId(home.department().getId())
            .departmentName(home.department().getName())
            .derivedFrom("LATEST_BASE_TRANSFER")
            .build();
    }

    @Transactional
    public ReportingHistoryResponseDto assignManager(Long employeeId, ReportingHistoryRequestDto req, UserPrincipal actor) {
        Employee employee = requireEmployee(employeeId);
        Employee manager = requireEmployee(req.getManagerEmployeeId());

        if (employee.getId().equals(manager.getId())) {
            throw new IllegalArgumentException("An employee cannot be their own manager");
        }

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

    @Transactional(readOnly = true)
    public Optional<Department> deriveHomeDepartmentEntity(Long employeeId) {
        return deriveHomePlacement(employeeId).map(HomePlacement::department);
    }

    private Optional<HomePlacement> deriveHomePlacement(Long employeeId) {
        Optional<EmployeeDepartmentHistory> currentOpt = historyRepository.findByEmployee_IdAndCurrentTrue(employeeId);
        if (currentOpt.isEmpty()) {
            return Optional.empty();
        }
        EmployeeDepartmentHistory current = currentOpt.get();
        if (current.getTransferType() != TransferType.TEMPORARY) {
            return Optional.of(new HomePlacement(current.getToDepartment(), current.getToPosition()));
        }
        List<EmployeeDepartmentHistory> baseTransfers =
            historyRepository.findLatestBaseTransfers(employeeId, BASE_TRANSFER_TYPES);
        if (baseTransfers.isEmpty()) {
            return Optional.empty();
        }
        EmployeeDepartmentHistory base = baseTransfers.get(0);
        return Optional.of(new HomePlacement(base.getToDepartment(), base.getToPosition()));
    }

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
        Position pos = positionRepository.findByIdWithLevelCodeAndRole(posId)
            .orElseThrow(() -> new IllegalArgumentException("Position not found: " + posId));
        DepartmentPosition mapping = departmentPositionRepository
            .findByDepartmentIdAndPositionId(deptId, posId)
            .orElseThrow(() -> new IllegalArgumentException("Position does not belong to the selected department"));
        if (!"active".equalsIgnoreCase(mapping.getStatus())) {
            throw new IllegalArgumentException("Position does not belong to the selected department");
        }
        return pos;
    }

    private EmployeeDepartmentHistory requireCurrentTransfer(Long employeeId) {
        return historyRepository.findByEmployee_IdAndCurrentTrue(employeeId)
            .orElseThrow(() -> new IllegalStateException(
                "No active transfer record found for employee " + employeeId +
                ". Employee may not have an INITIAL history row yet."));
    }

    private static void validateEffectiveDate(LocalDate newDate, LocalDate prevStartDate) {
        // Inclusive rule: new effective date can be the same day as the previous transfer start date.
        if (newDate.isBefore(prevStartDate)) {
            throw new IllegalArgumentException("Effective start date must be on or after the previous transfer start date: " + prevStartDate);
        }
    }

    private static void validateTemporaryEndDate(LocalDate startDate, LocalDate endDate) {
        if (!endDate.isAfter(startDate)) {
            throw new IllegalArgumentException("Effective end date must be after effective start date");
        }
    }

    private void closeTransfer(EmployeeDepartmentHistory row, LocalDate endDate, Long updatedBy) {
        row.setCurrent(false);
        row.setEffectiveEndDate(endDate);
        row.setUpdatedBy(updatedBy);
        row.setUpdatedOn(LocalDateTime.now());
        historyRepository.save(row);
    }

    private EmployeeDepartmentHistory buildTransfer(
            Employee employee, Department fromDept, Department toDept,
            Position fromPos, Position toPos,
            TransferType type, LocalDate startDate, LocalDate endDate,
            String reason, String remarks, Long createdBy) {
        EmployeeDepartmentHistory row = new EmployeeDepartmentHistory();
        row.setEmployee(employee);
        row.setFromDepartment(fromDept);
        row.setToDepartment(toDept);
        row.setFromPosition(fromPos);
        row.setToPosition(toPos);
        row.setTransferType(type);
        row.setEffectiveStartDate(startDate);
        row.setEffectiveEndDate(endDate);
        row.setCurrent(true);
        row.setReason(reason);
        row.setRemarks(remarks);
        row.setCreatedBy(createdBy);
        row.setCreatedOn(LocalDateTime.now());
        return row;
    }

    private String buildTransferMeta(EmployeeDepartmentHistory h) {
        return "{\"transferHistoryId\":%d,\"transferType\":\"%s\",\"toDepartmentId\":%d}"
            .formatted(h.getId(), h.getTransferType(), h.getToDepartment().getId());
    }

    private void sendTemporaryTransferNotification(
            Employee employee,
            Department toDept,
            Position toPos,
            LocalDate effectiveStartDate,
            LocalDate effectiveEndDate) {
        if (employee.getUserAccount() == null) {
            return;
        }
        String title = "Temporary Transfer Assigned";
        String message = "You have been temporarily transferred to "
            + toDept.getName()
            + " as "
            + toPos.getName()
            + " ("
            + effectiveStartDate.format(TRANSFER_DATE_FORMAT)
            + " - "
            + effectiveEndDate.format(TRANSFER_DATE_FORMAT)
            + ").";
        try {
            notificationService.send(employee.getUserAccount(), title, message, NOTIFICATION_SOURCE, employee.getId());
        } catch (Exception ignored) {
            // Keep transfer flow successful even if notification delivery fails.
        }
    }

    private void sendPermanentTransferNotification(
            Employee employee,
            Department toDept,
            Position toPos,
            LocalDate effectiveDate) {
        if (employee.getUserAccount() == null) {
            return;
        }
        String title = "Permanent Transfer Completed";
        String message = "You have been permanently transferred to "
            + toDept.getName()
            + " as "
            + toPos.getName()
            + " effective "
            + effectiveDate.format(TRANSFER_DATE_FORMAT)
            + ".";
        try {
            notificationService.send(employee.getUserAccount(), title, message, NOTIFICATION_SOURCE, employee.getId());
        } catch (Exception ignored) {
        }
    }

    private void sendMakePermanentNotification(
            Employee employee,
            Department toDept,
            Position toPos,
            LocalDate effectiveDate) {
        if (employee.getUserAccount() == null) {
            return;
        }
        String title = "Temporary Transfer Made Permanent";
        String message = "Your temporary transfer to "
            + toDept.getName()
            + " as "
            + toPos.getName()
            + " has been made permanent effective "
            + effectiveDate.format(TRANSFER_DATE_FORMAT)
            + ".";
        try {
            notificationService.send(employee.getUserAccount(), title, message, NOTIFICATION_SOURCE, employee.getId());
        } catch (Exception ignored) {
        }
    }

    private TransferHistoryResponseDto toDto(EmployeeDepartmentHistory h) {
        return TransferHistoryResponseDto.builder()
            .id(h.getId())
            .employeeId(h.getEmployee().getId())
            .transferType(h.getTransferType().name())
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

    private static final class HomePlacement {
        private final Department department;
        private final Position position;

        private HomePlacement(Department department, Position position) {
            this.department = department;
            this.position = position;
        }

        private Department department() {
            return department;
        }

        private Position position() {
            return position;
        }
    }
}
