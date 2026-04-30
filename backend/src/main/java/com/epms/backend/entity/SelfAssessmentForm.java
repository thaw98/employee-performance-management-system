package com.epms.backend.entity;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "self_assessment_form")
@Getter
@Setter
@NoArgsConstructor
public class SelfAssessmentForm {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private SelfAssessmentFormTemplate template;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cycle_id")
    private ReviewCycle cycle;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private SelfAssessmentFormStatus status = SelfAssessmentFormStatus.DRAFT;

    @Column(name = "total_score", precision = 10)
    private Double totalScore;

    @Column(name = "rating_category")
    private String ratingCategory;

    @Column(name = "employee_remarks", columnDefinition = "TEXT")
    private String employeeRemarks;

    @Column(name = "employee_signature_id")
    private Long employeeSignatureId;

    @Column(name = "employee_signature_date")
    private Instant employeeSignatureDate;

    @Column(name = "overall_remarks", columnDefinition = "TEXT")
    private String overallRemarks;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private Employee manager;

    @Column(name = "manager_signature_id")
    private Long managerSignatureId;

    @Column(name = "manager_signature_date")
    private Instant managerSignatureDate;

    @Column(name = "manager_comments", columnDefinition = "TEXT")
    private String managerComments;

    @Column(name = "hr_signature_id")
    private Long hrSignatureId;

    @Column(name = "hr_signature_date")
    private Instant hrSignatureDate;

    @Column(name = "hr_final_signature_id")
    private Long hrFinalSignatureId;

    @Column(name = "hr_final_signature_date")
    private Instant hrFinalSignatureDate;

    @Column(name = "hr_adjustment_signature_id")
    private Long hrAdjustmentSignatureId;

    @Column(name = "hr_adjustment_signature_date")
    private Instant hrAdjustmentSignatureDate;

    @Column(name = "created_date")
    private Instant createdDate;

    @Column(name = "updated_date")
    private Instant updatedDate;

    @Column(name = "submitted_date")
    private Instant submittedDate;

    @OneToMany(mappedBy = "form", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SelfAssessmentFormAnswer> answers = new ArrayList<>();

    public void addAnswer(SelfAssessmentFormAnswer answer) {
        answers.add(answer);
        answer.setForm(this);
    }

    public void clearAnswers() {
        answers.forEach(a -> a.setForm(null));
        answers.clear();
    }
}
