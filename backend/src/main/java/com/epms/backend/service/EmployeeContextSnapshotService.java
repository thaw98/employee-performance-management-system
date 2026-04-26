package com.epms.backend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.entity.Employee;
import com.epms.backend.entity.EmployeeContextSnapshot;
import com.epms.backend.entity.EmployeeDepartmentHistory;
import com.epms.backend.entity.EmployeeReportingHistory;
import com.epms.backend.entity.SnapshotModuleType;
import com.epms.backend.repository.EmployeeContextSnapshotRepository;
import com.epms.backend.repository.EmployeeDepartmentHistoryRepository;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.EmployeeReportingHistoryRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmployeeContextSnapshotService {

    private final EmployeeContextSnapshotRepository snapshotRepository;
    private final EmployeeDepartmentHistoryRepository historyRepository;
    private final EmployeeReportingHistoryRepository reportingRepository;
    private final EmployeeRepository employeeRepository;

    /**
     * Creates an immutable snapshot for the given module + reference. No-op if one already exists.
     *
     * @param moduleType  module (KPI, APPRAISAL, …)
     * @param referenceId the primary key of the module record
     * @param employeeId  subject employee
     * @param asOfDate    date to resolve context as-of
     * @param createdBy   acting user id
     * @return the snapshot (existing or newly created)
     */
    @Transactional
    public EmployeeContextSnapshot createSnapshot(
            SnapshotModuleType moduleType, Long referenceId,
            Long employeeId, LocalDate asOfDate, Long createdBy) {

        return snapshotRepository.findByModuleTypeAndReferenceId(moduleType, referenceId)
            .orElseGet(() -> buildAndSave(moduleType, referenceId, employeeId, asOfDate, createdBy));
    }

    private EmployeeContextSnapshot buildAndSave(
            SnapshotModuleType moduleType, Long referenceId,
            Long employeeId, LocalDate asOfDate, Long createdBy) {

        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + employeeId));

        EmployeeDepartmentHistory transferRow = historyRepository.findByEmployee_IdAndCurrentTrue(employeeId)
            .orElseThrow(() -> new IllegalStateException("No active transfer record for employee " + employeeId));

        EmployeeReportingHistory reportingRow = reportingRepository
            .findByEmployee_IdAndCurrentTrue(employeeId).orElse(null);

        EmployeeContextSnapshot snapshot = new EmployeeContextSnapshot();
        snapshot.setModuleType(moduleType);
        snapshot.setReferenceId(referenceId);
        snapshot.setEmployeeId(employeeId);
        snapshot.setEmployeeDepartmentHistoryId(transferRow.getId());
        snapshot.setEmployeeReportingHistoryId(reportingRow != null ? reportingRow.getId() : null);
        snapshot.setDepartmentId(transferRow.getToDepartment().getId());
        snapshot.setDepartmentName(transferRow.getToDepartment().getName());
        snapshot.setPositionId(transferRow.getToPosition().getId());
        snapshot.setPositionName(transferRow.getToPosition().getName());
        snapshot.setEmployeeName(employee.getEmployeeName());
        snapshot.setStaffNo(employee.getEmployeeId());
        if (reportingRow != null) {
            snapshot.setManagerEmployeeId(reportingRow.getManager().getId());
            snapshot.setManagerName(reportingRow.getManager().getEmployeeName());
        } else if (employee.getManager() != null) {
            snapshot.setManagerEmployeeId(employee.getManager().getId());
            snapshot.setManagerName(employee.getManager().getEmployeeName());
        }
        snapshot.setSnapshotEffectiveDate(asOfDate);
        snapshot.setCreatedBy(createdBy);
        snapshot.setCreatedOn(LocalDateTime.now());

        return snapshotRepository.save(snapshot);
    }
}
