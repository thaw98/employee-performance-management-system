package com.epms.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "self_assessment_form_answer")
@Getter
@Setter
@NoArgsConstructor
public class SelfAssessmentFormAnswer {

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

    @Column(name = "yes_no_answer")
    private String yesNoAnswer;

    @Column(name = "rating")
    private Integer rating;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "manager_proposed_yes_no")
    private String managerProposedYesNo;

    @Column(name = "manager_proposed_rating")
    private Integer managerProposedRating;

    @Column(name = "manager_proposed_comment", columnDefinition = "TEXT")
    private String managerProposedComment;

    @Column(name = "hr_adjustment_approved")
    private Boolean hrAdjustmentApproved;

    @Column(name = "final_approved_yes_no")
    private String finalApprovedYesNo;

    @Column(name = "final_approved_rating")
    private Integer finalApprovedRating;

    @Column(name = "retake_requested")
    private Boolean retakeRequested = false;

    @Column(name = "retake_request_comment", columnDefinition = "TEXT")
    private String retakeRequestComment;

    @Column(name = "retake_yes_no_answer")
    private String retakeYesNoAnswer;

    @Column(name = "retake_rating")
    private Integer retakeRating;

    @Column(name = "retake_reason", columnDefinition = "TEXT")
    private String retakeReason;

    @Column(name = "retake_submitted_at")
    private java.time.Instant retakeSubmittedAt;

    @Column(name = "retake_approved")
    private Boolean retakeApproved;

    @Column(name = "manager_force_changed")
    private Boolean managerForceChanged = false;

    @Column(name = "manager_force_change_reason", columnDefinition = "TEXT")
    private String managerForceChangeReason;

    @Column(name = "manager_force_changed_at")
    private java.time.Instant managerForceChangedAt;
}
