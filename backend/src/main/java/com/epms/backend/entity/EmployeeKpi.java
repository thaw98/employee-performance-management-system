package com.epms.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
