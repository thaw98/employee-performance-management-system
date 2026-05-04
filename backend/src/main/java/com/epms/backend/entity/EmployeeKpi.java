package com.epms.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "employeekpis")
@Getter
@Setter
@NoArgsConstructor
public class EmployeeKpi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String target;

    @Column(nullable = false)
    private String unit;

    private String actual;

    @Column(nullable = false)
    private BigDecimal weight;

    private BigDecimal score;

    @Column(name = "weighted_score")
    private BigDecimal weightedScore;

    @Column(nullable = false)
    private String period; // e.g. "2026-2027"

    @Column(nullable = false)
    private String status; // DRAFT, SUBMITTED, LOCKED

    @Column(name = "record_status", nullable = false)
    private String recordStatus = "Active"; // Active, Archived

    @Column(name = "created_date")
    private Instant createdDate;

    @Column(name = "updated_date")
    private Instant updatedDate;

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
