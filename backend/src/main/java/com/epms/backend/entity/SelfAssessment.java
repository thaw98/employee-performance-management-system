package com.epms.backend.entity;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "self_assessment")
@Getter
@Setter
@NoArgsConstructor

public class SelfAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "assessment_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cycle_id")
    private AppraisalCycle period;

    @Enumerated(EnumType.STRING)
    @Transient
    private SelfAssessmentStatus status = SelfAssessmentStatus.UNLOCKED;

    @Column(name = "status")
    private String statusValue = "Draft";

    @Column(name = "total_score")
    private Double totalScore;

    @Column(name = "rating_category")
    private String ratingCategory;

    @Column(name = "employee_remarks", columnDefinition = "text")
    private String employeeRemarks;

    @Column(name = "employee_signature_date")
    private Instant employeeSignatureDate;

    @Column(name = "manager_comments", columnDefinition = "text")
    private String managerComments;

    @Column(name = "manager_signature_date")
    private Instant managerSignatureDate;

    @Column(name = "hr_comments", columnDefinition = "text")
    private String hrComments;

    @Column(name = "hr_signature_date")
    private Instant hrSignatureDate;

    @Column(name = "submitted_date")
    private Instant submittedDate;

    @Column(name = "reviewed_date")
    private Instant reviewedDate;

    @Column(name = "approved_date")
    private Instant approvedDate;

    @Column(name = "created_date")
    private Instant createdDate;

    @Column(name = "updated_date")
    private Instant updatedDate;

    @jakarta.persistence.PrePersist
    protected void onCreate() {
        if (createdDate == null) {
            createdDate = java.time.Instant.now();
        }
    }

    @Column(name = "correction_remarks", columnDefinition = "text")
    private String correctionRemarks;

    @OneToMany(mappedBy = "selfAssessment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SelfAssessmentItem> items = new ArrayList<>();

    @Transient
    private String employeeSignature;

    @Transient
    private LocalDateTime employeeSignedAt;

    @Transient
    private String managerSignature;

    @Transient
    private LocalDateTime managerSignedAt;

    @Transient
    private String hrSignature;

    @Transient
    private LocalDateTime hrSignedAt;

    @Transient
    private Integer totalPoints;

    @Transient
    private LocalDateTime assessmentDate;

    @Transient
    private LocalDateTime createdAt;

    public SelfAssessmentStatus getStatus() {
        if (status != null) {
            return status;
        }
        if ("hr_approved".equalsIgnoreCase(statusValue) || "finalized".equalsIgnoreCase(statusValue)) {
            return SelfAssessmentStatus.FINALIZED;
        }
        if ("submitted".equalsIgnoreCase(statusValue) || "manager_reviewed".equalsIgnoreCase(statusValue)
                || "locked".equalsIgnoreCase(statusValue)) {
            return SelfAssessmentStatus.LOCKED;
        }
        return SelfAssessmentStatus.UNLOCKED;
    }

    public void setStatus(SelfAssessmentStatus status) {
        this.status = status;
        if (status == null) {
            this.statusValue = null;
            return;
        }
        switch (status) {
            case FINALIZED -> this.statusValue = "HR_Approved";
            case LOCKED -> this.statusValue = "Submitted";
            case UNLOCKED -> this.statusValue = "Draft";
        }
    }
}
