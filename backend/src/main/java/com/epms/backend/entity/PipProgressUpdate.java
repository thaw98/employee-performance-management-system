package com.epms.backend.entity;

import java.math.BigDecimal;
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
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pip_progress_update")
@Getter
@Setter
@NoArgsConstructor
public class PipProgressUpdate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "update_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pip_id", nullable = false)
    private Pip pip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "objective_id")
    private PipObjective objective;

    @Column(name = "update_date", nullable = false)
    private LocalDate updateDate;

    @Column(name = "progress_value", precision = 10, scale = 2, nullable = false)
    private BigDecimal progressValue;

    @Column(name = "comments", columnDefinition = "text")
    private String comments;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by", nullable = false)
    private Employee updatedBy;

    @Column(name = "created_date")
    private Instant createdDate;

    @Transient
    private Integer previousPercentage;

    @Transient
    public Integer getNewPercentage() {
        return progressValue == null ? null : progressValue.intValue();
    }

    public void setNewPercentage(Integer newPercentage) {
        this.progressValue = newPercentage == null ? null : BigDecimal.valueOf(newPercentage);
    }

    public String getFeedback() {
        return comments;
    }

    public void setFeedback(String feedback) {
        this.comments = feedback;
    }
}
