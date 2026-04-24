package com.epms.backend.entity;

import jakarta.persistence.*;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "appraisal_assignments")
@Getter
@Setter
@NoArgsConstructor
public class AppraisalAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private Long version;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "period_id")
    private AppraisalCycle period;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppraisalStatus status = AppraisalStatus.DRAFT;

    @Column(name = "hr_comments", columnDefinition = "TEXT")
    private String hrComments;

    @Column(name = "hr_signature", columnDefinition = "TEXT")
    private String hrSignature;

    @Column(name = "hr_signed_at")
    private Instant hrSignedAt;

    @Column(name = "total_score")
    private Double totalScore;

    @Column(name = "rating_category")
    private String ratingCategory;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    @OneToMany(mappedBy = "assignment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AppraisalAnswer> answers = new ArrayList<>();
}
