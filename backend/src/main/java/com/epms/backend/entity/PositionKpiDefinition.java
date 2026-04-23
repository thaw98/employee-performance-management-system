package com.epms.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "position_kpi_definition")
@Getter
@Setter
@NoArgsConstructor
public class PositionKpiDefinition {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "position_id", nullable = false)
    private Position position;

    @Column(nullable = false, length = 200)
    private String kpiName;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false, length = 50)
    private String target;

    @Column(length = 50)
    private String unit;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal weight;

    @Column(length = 20)
    private String priorityLevel;

    @Column(length = 10)
    private String logicDirection = "higher";

    private Integer displayOrder;

    private Boolean isActive = true;

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
