package com.epms.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "self_assessment_items")
public class SelfAssessmentItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "self_assessment_id", nullable = false)
    @JsonIgnore
    private SelfAssessment selfAssessment;

    @Column(name = "question_text", columnDefinition = "TEXT")
    private String questionText;

    @Column(name = "answer_yes_no")
    private Boolean answerYesNo;

    @Column(name = "rating")
    private Integer rating;
}
