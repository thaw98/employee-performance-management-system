package com.epms.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "feedback_limit_config")
@Getter
@Setter
@NoArgsConstructor
public class FeedbackLimitConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String relationshipType;

    private Long reviewCycleId;

    private String reviewCycleName;

    @Column(nullable = false)
    private Integer minimumCount;

    @Column(nullable = false)
    private Integer maximumCount;

    private Instant createdDate;
    private Instant updatedDate;
}
