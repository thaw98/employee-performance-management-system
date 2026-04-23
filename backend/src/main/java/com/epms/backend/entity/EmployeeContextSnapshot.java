package com.epms.backend.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name = "employee_context_snapshot",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_snapshot_module_ref",
        columnNames = {"module_type", "reference_id"}
    )
)
@Getter
@Setter
@NoArgsConstructor
public class EmployeeContextSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "module_type", nullable = false, length = 30)
    private SnapshotModuleType moduleType;

    @Column(name = "reference_id", nullable = false)
    private Long referenceId;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "employee_department_history_id", nullable = false)
    private Long employeeDepartmentHistoryId;

    @Column(name = "employee_reporting_history_id")
    private Long employeeReportingHistoryId;

    @Column(name = "department_id", nullable = false)
    private Long departmentId;

    @Column(name = "department_name", nullable = false, length = 255)
    private String departmentName;

    @Column(name = "position_id", nullable = false)
    private Long positionId;

    @Column(name = "position_name", nullable = false, length = 255)
    private String positionName;

    @Column(name = "employee_name", nullable = false, length = 255)
    private String employeeName;

    @Column(name = "staff_no", nullable = false, length = 50)
    private String staffNo;

    @Column(name = "manager_employee_id")
    private Long managerEmployeeId;

    @Column(name = "manager_name", length = 255)
    private String managerName;

    @Column(name = "appraiser_employee_id")
    private Long appraiserEmployeeId;

    @Column(name = "appraiser_name", length = 255)
    private String appraiserName;

    @Column(name = "snapshot_effective_date", nullable = false)
    private LocalDate snapshotEffectiveDate;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_on", nullable = false)
    private LocalDateTime createdOn;
}
