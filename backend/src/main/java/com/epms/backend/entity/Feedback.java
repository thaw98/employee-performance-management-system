package com.epms.backend.entity;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "feedback_360")
@Getter
@Setter
@NoArgsConstructor
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "feedback_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private Employee evaluator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_employee_id")
    private Employee evaluatee;

    @Column(name = "reviewer_relationship")
    private String reviewerRelationship;

    @Column(name = "submission_date")
    private Instant submissionDate;

    @Column(name = "assigned_date")
    private Instant assignedDate;

    @Column(name = "due_date")
    private LocalDate assessmentDate;

    @Column(name = "status")
    private String status;

    @OneToMany(mappedBy = "feedback", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FeedbackDetail> details = new ArrayList<>();

    @Transient
    private Position evaluateePosition;

    @Transient
    private String evaluateeName;

    @Transient
    private Integer totalPoints;

    @Transient
    private Double totalScore;

    @Transient
    private String scoreGrade;
}
