package com.epms.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "pip_progress_updates")
public class PipProgressUpdate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "objective_id", nullable = false)
    private PipObjective objective;

    @Column(nullable = false)
    private Integer previousPercentage;

    @Column(nullable = false)
    private Integer newPercentage;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @ManyToOne(optional = false)
    @JoinColumn(name = "updated_by", nullable = false)
    private User updatedBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
