package com.epms.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "employee_kpi_assignment")
@Getter
@Setter
@NoArgsConstructor
public class EmployeeKpiAssignment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "period_id", nullable = false)
    private KpiPeriod period;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "position_kpi_id", nullable = false)
    private PositionKpiDefinition positionKpi;

    private BigDecimal actualValue;

    private BigDecimal score;

    private BigDecimal weightedScore;

    @Column(length = 20)
    private String status = "DRAFT";

    @Column(columnDefinition = "text")
    private String remarks;

    @Column(name = "created_date")
    private Instant createdDate;

    @Column(name = "updated_date")
    private Instant updatedDate;

    @Column(name = "updated_by")
    private String updatedBy;

    private Boolean isLocked = false;

    @PrePersist
    protected void onCreate() {
        createdDate = Instant.now();
        updatedDate = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedDate = Instant.now();
    }
}
