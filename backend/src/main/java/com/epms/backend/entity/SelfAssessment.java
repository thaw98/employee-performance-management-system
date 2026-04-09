package com.epms.backend.entity;

import java.time.LocalDateTime;
import java.util.List;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Getter
@Setter
@Entity
@Table(name = "self_assessment_records")
public class SelfAssessment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "assessment_date")
    private LocalDateTime assessmentDate;

    @Column(name = "total_points")
    private Integer totalPoints;

    @Column(name = "total_score")
    private Double totalScore;

    @Column(name = "rating_category")
    private String ratingCategory;

    @Column(name = "employee_remarks", columnDefinition = "TEXT")
    private String employeeRemarks;

    @Column(name = "manager_comments", columnDefinition = "TEXT")
    private String managerComments;

    @Column(name = "hr_comments", columnDefinition = "TEXT")
    private String hrComments;

    @Column(name = "employee_signature")
    private String employeeSignature;

    @Column(name = "manager_signature")
    private String managerSignature;

    @Column(name = "hr_signature")
    private String hrSignature;

    @Column(name = "employee_signed_at")
    private LocalDateTime employeeSignedAt;

    @Column(name = "manager_signed_at")
    private LocalDateTime managerSignedAt;

    @Column(name = "hr_signed_at")
    private LocalDateTime hrSignedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private SelfAssessmentStatus status;

    @OneToMany(mappedBy = "selfAssessment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SelfAssessmentItem> items;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
