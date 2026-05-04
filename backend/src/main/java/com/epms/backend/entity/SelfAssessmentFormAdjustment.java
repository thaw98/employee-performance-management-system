package com.epms.backend.entity;

import java.time.Instant;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "self_assessment_form_adjustment")
@Getter
@Setter
@NoArgsConstructor
public class SelfAssessmentFormAdjustment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "form_id", nullable = false)
    private SelfAssessmentForm form;

    @Column(name = "question_text", columnDefinition = "TEXT", nullable = false)
    private String questionText;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(name = "original_yes_no")
    private String originalYesNo;

    @Column(name = "original_rating")
    private Integer originalRating;

    @Column(name = "proposed_yes_no")
    private String proposedYesNo;

    @Column(name = "proposed_rating")
    private Integer proposedRating;

    @Column(name = "manager_comment", columnDefinition = "TEXT")
    private String managerComment;

    @Column(name = "hr_decision")
    private String hrDecision;

    @Column(name = "hr_rejection_reason", columnDefinition = "TEXT")
    private String hrRejectionReason;

    @Column(name = "adjusted_at")
    private Instant adjustedAt;

    @Column(name = "adjusted_by")
    private Long adjustedBy;
}