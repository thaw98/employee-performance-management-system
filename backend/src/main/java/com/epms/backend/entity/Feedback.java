package com.epms.backend.entity;

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
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "feedbacks")
public class Feedback {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluator_user_id", nullable = false)
    private User evaluator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluatee_employee_id", nullable = true)
    private Employee evaluatee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluatee_position_id", nullable = true)
    private Position evaluateePosition;

    @Column(name = "evaluatee_name", length = 255)
    private String evaluateeName;

    @Column(name = "assessment_date", nullable = false)
    private LocalDate assessmentDate;

    @Column(name = "total_points", nullable = false)
    private Integer totalPoints;

    @Column(name = "total_score", nullable = false)
    private Double totalScore;

    @Column(name = "score_grade", length = 50)
    private String scoreGrade; // e.g. "Outstanding"

    @OneToMany(mappedBy = "feedback", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FeedbackDetail> details = new ArrayList<>();
}
