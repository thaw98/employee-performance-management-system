package com.epms.backend.entity;

import java.time.Instant;
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
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "self_assessment_form_template_version",
        uniqueConstraints = @UniqueConstraint(name = "uk_saftv_template_version_no", columnNames = {"template_id", "version_number"}))
@Getter
@Setter
@NoArgsConstructor
public class SelfAssessmentFormTemplateVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private SelfAssessmentFormTemplate template;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_on")
    private Instant createdOn;

    @OneToMany(mappedBy = "templateVersion", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<SelfAssessmentFormTemplateQuestion> questions = new ArrayList<>();

    public void addQuestion(SelfAssessmentFormTemplateQuestion question) {
        questions.add(question);
        question.setTemplateVersion(this);
    }

    public void removeQuestion(SelfAssessmentFormTemplateQuestion question) {
        questions.remove(question);
        question.setTemplateVersion(null);
    }
}
