package com.epms.backend.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "pips")
public class Pip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;

    @ManyToOne(optional = false)
    @JoinColumn(name = "manager_id", nullable = false)
    private User manager;

    @Column(nullable = false)
    private String status; // ACTIVE, COMPLETED, CLOSED

    @Column(nullable = false)
    @JsonFormat(pattern = "dd/MM/yyyy")
    private LocalDate startDate;

    @Column(nullable = false)
    @JsonFormat(pattern = "dd/MM/yyyy")
    private LocalDate endDate;

    @Column(columnDefinition = "TEXT")
    private String closingRemarks;

    @Column
    private String finalOutcome;

    @OneToMany(mappedBy = "pip", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<PipObjective> objectives;

    @OneToMany(mappedBy = "pip", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<FollowUpMeeting> followUpMeetings;

    @Column(nullable = false, updatable = false)
    @JsonFormat(pattern = "dd/MM/yyyy HH:mm")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column
    @JsonFormat(pattern = "dd/MM/yyyy HH:mm")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(nullable = false)
    private Integer totalHours = 0;

    @Column(nullable = false)
    private Integer completedHours = 0;

    @Column(columnDefinition = "TEXT")
    private String reopenReason;

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
