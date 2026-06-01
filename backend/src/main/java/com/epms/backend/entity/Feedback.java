package com.epms.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "feedback")
@Getter
@Setter
@NoArgsConstructor
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "feedback_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluator_id", nullable = false)
    private Employee evaluator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluatee_id", nullable = false)
    private Employee evaluatee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_cycle_id")
    private ReviewCycle reviewCycle;

    @Column(name = "evaluator_role", nullable = false, length = 20)
    private String role; // MANAGER, PEER, SUBORDINATE

    @Column(name = "total_score")
    private Double score;

    @Column(name = "remark", length = 50)
    private String remark;

    @Column(name = "anonymous")
    private Boolean anonymous = false;

    @Column(name = "additional_comments", length = 1000)
    private String additionalComments;

    @Column(name = "feedback_date")
    private Instant createdDate;

    @Column(name = "max_rating")
    private Integer maxRating = 5;

    @OneToMany(mappedBy = "feedback", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FeedbackDetail> details;
}
