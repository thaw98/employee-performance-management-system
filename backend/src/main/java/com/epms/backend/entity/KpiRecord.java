// KpiRecord.java - Updated without AppraisalCycle
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
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
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

    @Column(name = "period_id")
    private Long periodId;

    @Column(name = "period_name", length = 100)
    private String periodName;

    @Column(name = "kpi_name", nullable = false, length = 200)
    private String kpi;

    @Column(name = "category", nullable = false, length = 100)
    private String category;

    @Column(name = "target_value", precision = 10, scale = 2)
    private BigDecimal targetValue;

    @Column(name = "target_display", length = 100)
    private String targetDisplay;

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "weight_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal weight;

    @Column(name = "priority_level", length = 20)
    private String priorityLevel;

    @Column(name = "actual_value", precision = 10, scale = 2)
    private BigDecimal actualValue;

    @Column(name = "actual_display", length = 100)
    private String actualDisplay;

    @Column(name = "score", precision = 5, scale = 2)
    private BigDecimal score;

    @Column(name = "weighted_score", precision = 5, scale = 2)
    private BigDecimal weightedScore;

    @Column(name = "logic_direction", length = 10)
    private String logicDirection = "higher";

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private KpiStatus status = KpiStatus.DRAFT;

    @Column(name = "remarks", columnDefinition = "text")
    private String remarks;

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

    @Column(name = "locked_date")
    private Instant lockedDate;

    @Column(name = "revision_number")
    private Integer revisionNumber = 0;

    @PrePersist
    protected void onCreate() {
        createdDate = Instant.now();
        updatedDate = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedDate = Instant.now();
    }

    public String getTarget() {
        return targetDisplay != null ? targetDisplay : 
               (targetValue != null ? stripZeros(targetValue) : null);
    }

    public void setTarget(String target) {
        this.targetDisplay = target;
        try {
            if (target != null && !target.isBlank()) {
                String numericStr = target.replaceAll("[^\\d.-]", "");
                if (!numericStr.isEmpty() && !numericStr.equals("-")) {
                    this.targetValue = new BigDecimal(numericStr);
                }
            }
        } catch (NumberFormatException e) {
            this.targetValue = null;
        }
    }

    public String getActual() {
        return actualDisplay != null ? actualDisplay :
               (actualValue != null ? stripZeros(actualValue) : null);
    }

    public void setActual(String actual) {
        this.actualDisplay = actual;
        try {
            if (actual != null && !actual.isBlank()) {
                String numericStr = actual.replaceAll("[^\\d.-]", "");
                if (!numericStr.isEmpty() && !numericStr.equals("-")) {
                    this.actualValue = new BigDecimal(numericStr);
                }
            }
        } catch (NumberFormatException e) {
            this.actualValue = null;
        }
    }

    private static String stripZeros(BigDecimal value) {
        if (value == null) return null;
        return value.stripTrailingZeros().toPlainString();
    }
}