package com.epms.backend.entity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "self_assessment_form_template")
@Getter
@Setter
@NoArgsConstructor
public class SelfAssessmentFormTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "position_id", nullable = false)
    private Position position;

    @Column(name = "title", length = 255)
    private String title;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_on")
    private Instant createdOn;

    @Column(name = "updated_by")
    private Long updatedBy;

    @Column(name = "updated_on")
    private Instant updatedOn;

    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, orphanRemoval = false)
    @OrderBy("sortOrder ASC")
    private List<SelfAssessmentFormTemplateQuestion> questions = new ArrayList<>();

    public void addQuestion(SelfAssessmentFormTemplateQuestion question) {
        questions.add(question);
        question.setTemplate(this);
    }
}
