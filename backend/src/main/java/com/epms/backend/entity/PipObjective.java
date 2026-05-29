package com.epms.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "pip_objective")
@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PipObjective {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "objective_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pip_id", nullable = false)
    @JsonIgnore
    private Pip pip;

    @Column(name = "objective_description", columnDefinition = "text", nullable = false)
    private String objectiveDescription;

    @Column(name = "target_value", precision = 10, scale = 2, nullable = false)
    private BigDecimal targetValue = BigDecimal.valueOf(100);

    @Column(name = "current_value", precision = 10, scale = 2)
    private BigDecimal currentValue = BigDecimal.ZERO;

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "weight_percentage", precision = 5, scale = 2, nullable = false)
    private BigDecimal weightPercentage = BigDecimal.valueOf(100);

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate = LocalDate.now();

    @Column(name = "status", length = 20)
    private String status = "Not_Started";

    @Column(name = "created_date")
    private Instant createdDate;

    @Column(name = "updated_date")
    private Instant updatedDate;

    @Column(name = "active_session_start")
    private Instant activeSessionStart;

    public String getDescription() {
        return objectiveDescription;
    }

    public void setDescription(String description) {
        this.objectiveDescription = description;
    }

    @Transient
    public Integer getProgressPercentage() {
        if (targetValue == null || BigDecimal.ZERO.compareTo(targetValue) == 0 || currentValue == null) {
            return 0;
        }
        int value = currentValue.multiply(BigDecimal.valueOf(100))
                .divide(targetValue, 0, RoundingMode.HALF_UP)
                .intValue();
        return Math.max(0, Math.min(100, value));
    }

    @Transient
    public BigDecimal getTotalHours() {
        return targetValue == null ? BigDecimal.ZERO : targetValue;
    }

    @Transient
    public BigDecimal getCompletedHours() {
        return currentValue == null ? BigDecimal.ZERO : currentValue;
    }

    @Transient
    public BigDecimal getRemainingHours() {
        BigDecimal remaining = getTotalHours().subtract(getCompletedHours());
        return remaining.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : remaining;
    }

    @Transient
    public Boolean getTimerRunning() {
        return activeSessionStart != null;
    }
}
