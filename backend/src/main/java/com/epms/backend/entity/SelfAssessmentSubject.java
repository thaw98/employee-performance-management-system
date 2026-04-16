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

@Entity
@Table(name = "self_assessment_question")
@Getter
@Setter
@NoArgsConstructor
public class SelfAssessmentSubject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "question_id")
    private Long id;

    @Column(name = "question_text", columnDefinition = "text", nullable = false)
    private String subjectText;

    @Column(name = "sort_order")
    private Integer displayOrder;

    @Column(name = "is_active")
    private Boolean isActive;
}
