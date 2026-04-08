package com.epms.backend.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "follow_up_meetings")
public class FollowUpMeeting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "pip_id", nullable = false)
    @JsonIgnore
    private Pip pip;

    @Column(nullable = false)
    @JsonFormat(pattern = "dd/MM/yyyy HH:mm")
    private LocalDateTime meetingTime;

    @Column(nullable = false)
    private String status; // SCHEDULED, COMPLETED, CANCELLED

    @Column(nullable = false)
    private boolean reminderSent = false;

    @Column(nullable = false, updatable = false)
    @JsonFormat(pattern = "dd/MM/yyyy HH:mm")
    private LocalDateTime createdAt = LocalDateTime.now();
}
