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

import java.time.Instant;

@Entity
@Table(name = "feedback_template_config")
@Getter
@Setter
@NoArgsConstructor
public class FeedbackTemplateConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String templateName;

    @Column(nullable = false, length = 30)
    private String targetType;

    @Column(nullable = false)
    private Long targetId;

    private String targetName;

    private Long reviewCycleId;

    private String reviewCycleName;

    @Column(columnDefinition = "text")
    private String questionIds;

    @Column(name = "role_question_ids", columnDefinition = "text")
    private String roleQuestionIds;

    @Column(name = "active_roles", columnDefinition = "text")
    private String activeRoles;

    @Column(columnDefinition = "text")
    private String audienceRulesJson;

    @Column(length = 20)
    private String status = "ACTIVE";

    @Column(name = "max_rating", nullable = false)
    private Integer maxRating = 5;

    private Instant createdDate;
    private Instant updatedDate;
}
