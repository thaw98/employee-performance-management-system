package com.epms.backend.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "continuous_feedback")
@Getter
@Setter
@NoArgsConstructor
public class ContinuousFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "feedback_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id", nullable = false)
    private Employee manager;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    private ContinuousFeedbackCategory category;

    @Column(name = "feedback_message", columnDefinition = "TEXT")
    private String feedbackMessage;

    @Column(name = "private_manager_note", columnDefinition = "TEXT")
    private String privateManagerNote;

    @Enumerated(EnumType.STRING)
    @Column(name = "visibility_status", nullable = false, length = 20)
    private ContinuousFeedbackVisibilityStatus visibilityStatus = ContinuousFeedbackVisibilityStatus.PRIVATE_NOTE;

    @Column(name = "is_shared", nullable = false)
    private boolean shared = false;

    @Column(name = "shared_at")
    private Instant sharedAt;

    @Column(name = "acknowledged", nullable = false)
    private boolean acknowledged = false;

    @Column(name = "acknowledged_at")
    private Instant acknowledgedAt;

    @Column(name = "is_supporting_evidence", nullable = false)
    private boolean supportingEvidence = true;

    @Column(name = "pip_suggested", nullable = false)
    private boolean pipSuggested = false;

    @Column(name = "pip_suggested_at")
    private Instant pipSuggestedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by_user_id")
    private User updatedBy;
}
