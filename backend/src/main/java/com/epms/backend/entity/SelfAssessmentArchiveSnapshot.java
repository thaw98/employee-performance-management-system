package com.epms.backend.entity;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "self_assessment_archive_snapshot")
@Getter
@Setter
@NoArgsConstructor
public class SelfAssessmentArchiveSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "original_form_id", nullable = false)
    private Long originalFormId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "employee_name", nullable = false, length = 255)
    private String employeeName;

    @Column(name = "employee_staff_no", length = 50)
    private String employeeStaffNo;

    @Column(name = "department_id")
    private Long departmentId;

    @Column(name = "department_name", length = 255)
    private String departmentName;

    @Column(name = "position_id")
    private Long positionId;

    @Column(name = "position_name", length = 255)
    private String positionName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private SelfAssessmentFormTemplate template;

    @Column(name = "template_title", nullable = false, length = 255)
    private String templateTitle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cycle_id")
    private ReviewCycle cycle;

    @Column(name = "cycle_name", length = 255)
    private String cycleName;

    @Enumerated(EnumType.STRING)
    @Column(name = "archived_status", nullable = false, length = 40)
    private SelfAssessmentFormStatus archivedStatus;

    @Column(name = "rejection_reason", columnDefinition = "TEXT", nullable = false)
    private String rejectionReason;

    @Column(name = "hr_user_id", nullable = false)
    private Long hrUserId;

    @Column(name = "hr_user_name", length = 255)
    private String hrUserName;

    @Column(name = "archived_at", nullable = false)
    private Instant archivedAt;

    @Column(name = "retake_deadline", nullable = false)
    private LocalDate retakeDeadline;

    @Column(name = "total_score", precision = 10)
    private Double totalScore;

    @Column(name = "manager_revised_total_score", precision = 10)
    private Double managerRevisedTotalScore;

    @Column(name = "final_approved_total_score", precision = 10)
    private Double finalApprovedTotalScore;

    @Column(name = "rating_category", length = 50)
    private String ratingCategory;

    @Column(name = "form_snapshot", columnDefinition = "JSON", nullable = false)
    private String formSnapshot;
}
