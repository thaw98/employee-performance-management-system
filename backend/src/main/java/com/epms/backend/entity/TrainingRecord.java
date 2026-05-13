package com.epms.backend.entity;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "training_development_history")
@Getter
@Setter
@NoArgsConstructor
public class TrainingRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "training_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonIgnore
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pip_id")
    @JsonIgnore
    private Pip pip;

    @Column(name = "training_name", nullable = false)
    private String trainingName;

    @Column(name = "training_provider")
    private String trainingProvider;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "completion_status")
    private String completionStatus;

    @Column(name = "total_completed_hours")
    private Integer totalCompletedHours;

    @Column(name = "percentage_completion")
    private Integer percentageCompletion;

    @Column(name = "feedback_notes", columnDefinition = "text")
    private String feedbackNotes;


    @Column(name = "created_date")
    private Instant createdDate;

    @Column(name = "updated_date")
    private Instant updatedDate;

    public LocalDate getCompletionDate() {
        return endDate;
    }

    public void setCompletionDate(LocalDate completionDate) {
        this.endDate = completionDate;
        if (this.startDate == null) {
            this.startDate = completionDate;
        }
    }

    public String getStatus() {
        return completionStatus;
    }

    public void setStatus(String status) {
        this.completionStatus = status;
    }
}
