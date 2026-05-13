package com.epms.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
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
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "performance_improvement_plan")
@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Pip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pip_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id", nullable = false)
    private Employee manager;





    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "target_end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "original_end_date")
    private LocalDate originalEndDate;

    @Column(name = "auto_close_date")
    private LocalDate autoCloseDate;

    @Column(name = "extended_end_date")
    private LocalDate extendedEndDate;

    @Column(name = "final_close_date")
    private LocalDate finalCloseDate;

    @Column(name = "actual_end_date")
    private LocalDate actualEndDate;

    @Column(name = "overall_progress_percentage", precision = 5, scale = 2)
    private BigDecimal overallProgressPercentage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private Employee createdBy;

    @Column(name = "created_date")
    private Instant createdDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "closed_by")
    private Employee closedBy;

    @Column(name = "closed_date")
    private Instant closedDate;

    @Column(name = "closing_remarks", columnDefinition = "text")
    private String closingRemarks;

    @Column(name = "employee_signature", columnDefinition = "LONGTEXT")
    private String employeeSignature;

    @Column(name = "employee_signature_date")
    private Instant employeeSignatureDate;

    @Column(name = "manager_signature", columnDefinition = "LONGTEXT")
    private String managerSignature;

    @Column(name = "manager_signature_date")
    private Instant managerSignatureDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reopened_by")
    private Employee reopenedBy;

    @Column(name = "reopened_date")
    private Instant reopenedDate;

    @Column(name = "reopen_reason", columnDefinition = "text")
    private String reopenReason;

    @Column(name = "review_reason", columnDefinition = "text")
    private String reviewReason;

    @Column(name = "reopen_decision", length = 20)
    private String reopenDecision;

    @Column(name = "reopen_decision_date")
    private Instant reopenDecisionDate;

    @Column(name = "updated_date")
    private Instant updatedDate;

    @OneToMany(mappedBy = "pip", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PipObjective> objectives = new ArrayList<>();

    @OneToMany(mappedBy = "pip", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FollowUpMeeting> followUpMeetings = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "pip", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PipCommunicationNote> communicationNotes = new ArrayList<>();

    @Column(name = "total_hours")
    private Integer totalHours;

    @Column(name = "completed_hours")
    private Integer completedHours;

    @Column(name = "final_outcome", length = 50)
    private String finalOutcome;

    @Column(name = "expected_improvements", columnDefinition = "text")
    private String expectedImprovements;

    @Column(name = "reason_for_plan", columnDefinition = "text")
    private String reasonForPlan;

    @Transient
    private LocalDateTime employeeSignedAt;

    @Transient
    private LocalDateTime managerSignedAt;

    public LocalDateTime getEmployeeSignedAt() {
        if (employeeSignedAt != null) {
            return employeeSignedAt;
        }
        return employeeSignatureDate == null ? null : LocalDateTime.ofInstant(employeeSignatureDate, ZoneId.systemDefault());
    }

    public LocalDateTime getManagerSignedAt() {
        if (managerSignedAt != null) {
            return managerSignedAt;
        }
        return managerSignatureDate == null ? null : LocalDateTime.ofInstant(managerSignatureDate, ZoneId.systemDefault());
    }
}
