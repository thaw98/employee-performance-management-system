package com.epms.backend.entity;

import java.time.Instant;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "self_assessment_form_template_question")
@Getter
@Setter
@NoArgsConstructor
public class SelfAssessmentFormTemplateQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_version_id", nullable = false)
    private SelfAssessmentFormTemplateVersion templateVersion;

    @Column(name = "question_text", columnDefinition = "TEXT", nullable = false)
    private String questionText;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_on")
    private Instant createdOn;
}