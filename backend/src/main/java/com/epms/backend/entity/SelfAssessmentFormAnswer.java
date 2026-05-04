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
}