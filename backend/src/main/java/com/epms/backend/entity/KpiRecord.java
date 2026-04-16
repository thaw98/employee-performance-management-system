package com.epms.backend.entity;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "employee_kpi")
@Getter
@Setter
@NoArgsConstructor
public class KpiRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "employee_kpi_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cycle_id", nullable = false)
    private KpiPeriod period;

    @Column(name = "kpi_name", nullable = false)
    private String kpi;

    @Column(name = "category", nullable = false)
    private String category;

    @Column(name = "target_value", precision = 10, scale = 2)
    private BigDecimal targetValue;

    @Column(name = "unit")
    private String unit;

    @Column(name = "weight_percentage", precision = 5, scale = 2)
    private BigDecimal weight;

    @Column(name = "priority_level")
    private String priorityLevel;

    @Column(name = "actual_value", precision = 10, scale = 2)
    private BigDecimal actualValue;

    @Column(name = "weighted_score", precision = 5, scale = 2)
    private BigDecimal weightedScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private KpiStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Employee createdBy;

    @Column(name = "created_date")
    private Instant createdDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private Employee updatedBy;

    @Column(name = "updated_date")
    private Instant updatedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "locked_by")
    private Employee lockedBy;

    @Column(name = "locked_date")
    private Instant lockedDate;

    @Column(name = "revision_number")
    private Integer revisionNumber;

    @Transient
    private Employee manager;

    @Transient
    private String target;

    @Transient
    private String actual;

    @Transient
    private Double score;

    @Transient
    private String logicDirection;

    public String getTarget() {
        return target != null ? target : (targetValue == null ? null : stripZeros(targetValue));
    }

    public void setTarget(String target) {
        this.target = target;
        this.targetValue = parseDecimal(target);
    }

    public String getActual() {
        return actual != null ? actual : (actualValue == null ? null : stripZeros(actualValue));
    }

    public void setActual(String actual) {
        this.actual = actual;
        this.actualValue = parseDecimal(actual);
    }

    private static BigDecimal parseDecimal(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return new BigDecimal(value.replaceAll("[^\\d.-]", ""));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static String stripZeros(BigDecimal value) {
        return value.stripTrailingZeros().toPlainString();
    }
}
