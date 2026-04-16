package com.epms.backend.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "feedback_criteria")
@Getter
@Setter
@NoArgsConstructor
public class Criteria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "criteria_id")
    private Long id;

    @Column(name = "criteria_name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @Column(name = "is_active")
    private Boolean active;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "created_date")
    private Instant createdDate;

    public boolean isActive() {
        return Boolean.TRUE.equals(active);
    }
}
