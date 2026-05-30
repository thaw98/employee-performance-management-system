package com.epms.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "self_assessment_settings")
@Getter
@Setter
@NoArgsConstructor
public class SelfAssessmentSettings {

    public static final Long SINGLETON_ID = 1L;

    @Id
    @Column(name = "id")
    private Long id = SINGLETON_ID;

    @Enumerated(EnumType.STRING)
    @Column(name = "rating_system", nullable = false)
    private SelfAssessmentRatingSystem ratingSystem = SelfAssessmentRatingSystem.FIVE_POINT;

    @Column(name = "ten_point_yes_min_rating", nullable = false)
    private Integer tenPointYesMinRating = SelfAssessmentRatingSystem.DEFAULT_TEN_POINT_YES_MIN_RATING;

    @Column(name = "five_point_yes_min_rating", nullable = false)
    private Integer fivePointYesMinRating = SelfAssessmentRatingSystem.DEFAULT_FIVE_POINT_YES_MIN_RATING;

    @Column(name = "updated_by")
    private Long updatedBy;

    @Column(name = "updated_on")
    private Instant updatedOn;
}
