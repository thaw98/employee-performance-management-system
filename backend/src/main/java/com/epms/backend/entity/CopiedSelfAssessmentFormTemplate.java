package com.epms.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "copied_self_assessment_form_template")
@Getter
@Setter
@NoArgsConstructor
public class CopiedSelfAssessmentFormTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_template_id", nullable = false)
    private SelfAssessmentFormTemplate sourceTemplate;

    @Column(name = "title", length = 255, nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "rating_system", nullable = false)
    private SelfAssessmentRatingSystem ratingSystem = SelfAssessmentRatingSystem.FIVE_POINT;

    @Column(name = "ten_point_yes_min_rating", nullable = false)
    private Integer tenPointYesMinRating = SelfAssessmentRatingSystem.DEFAULT_TEN_POINT_YES_MIN_RATING;

    @Column(name = "five_point_yes_min_rating", nullable = false)
    private Integer fivePointYesMinRating = SelfAssessmentRatingSystem.DEFAULT_FIVE_POINT_YES_MIN_RATING;

    @Column(name = "include_yes_no", nullable = false)
    private boolean includeYesNo = true;

    @Column(name = "created_by", nullable = false, unique = true)
    private Long createdBy;

    @Column(name = "created_on", nullable = false)
    private Instant createdOn;

    /** Nullable for legacy rows; resolved from {@link #sourceTemplate} when missing. */
    @Column(name = "department_id")
    private Long departmentId;

    /** Nullable for legacy rows; resolved from {@link #sourceTemplate} when missing. */
    @Column(name = "position_id")
    private Long positionId;

    @OneToMany(mappedBy = "copiedTemplate", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<CopiedSelfAssessmentFormTemplateQuestion> questions = new ArrayList<>();

    public void addQuestion(CopiedSelfAssessmentFormTemplateQuestion question) {
        questions.add(question);
        question.setCopiedTemplate(this);
    }
}
