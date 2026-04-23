package com.epms.backend.entity;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

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

@Entity
@Table(name = "one_on_one_meeting")
@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties({ "manager", "employee", "createdBy" })
public class OneOnOneMeeting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "meeting_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private Employee manager;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Employee createdBy;

    @Column(name = "meeting_date")
    private LocalDate meetingDate;

    @Column(name = "meeting_time")
    private LocalTime meetingTime;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "status", length = 30)
    private String status;

    @Column(name = "notes", columnDefinition = "text")
    private String notes;

    @Column(name = "created_date")
    private Instant createdDate;

    @Column(name = "updated_date")
    private Instant updatedDate;
}
