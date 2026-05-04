package com.epms.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(
        name = "review_cycles",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_review_cycles_year_type_sequence",
                columnNames = {"year_label", "cycle_type", "sequence_no"}
        )
)
@Getter
@Setter
@NoArgsConstructor
public class ReviewCycle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "time_setting_id")
    private TimeSetting timeSetting;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_cycle_id")
    private ReviewCycle parentCycle;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "code", nullable = false)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "cycle_type", nullable = false)
    private CycleType cycleType;

    @Column(name = "year_label", nullable = false)
    private String yearLabel;

    @Column(name = "sequence_no", nullable = false)
    private Integer sequenceNo;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "requires_employee_submission", nullable = false)
    private boolean requiresEmployeeSubmission;

    @Enumerated(EnumType.STRING)
    @Column(name = "rollup_method")
    private RollupMethod rollupMethod;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }

    public enum CycleType {
        ANNUAL,
        SEMI_ANNUAL,
        QUARTERLY,
        CUSTOM
    }

    public enum RollupMethod {
        AVERAGE
    }
}
