package com.epms.backend.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "self_assessment_answer")
@Getter
@Setter
@NoArgsConstructor
public class SelfAssessmentItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "answer_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private SelfAssessment selfAssessment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private SelfAssessmentSubject subject;

    @Column(name = "yes_no_answer")
    private String yesNoAnswer;

    @Column(name = "rating_value", nullable = false)
    private Integer rating;

    @Column(name = "remarks", columnDefinition = "text")
    private String remarks;

    @Column(name = "created_date")
    private Instant createdDate;

    @Transient
    private String questionText;

    public boolean getAnswerYesNo() {
        return "Yes".equalsIgnoreCase(yesNoAnswer);
    }

    public void setAnswerYesNo(boolean answerYesNo) {
        this.yesNoAnswer = answerYesNo ? "Yes" : "No";
    }
}
