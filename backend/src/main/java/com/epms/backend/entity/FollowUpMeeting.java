package com.epms.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pip_follow_up_meeting")
@Getter
@Setter
@NoArgsConstructor
public class FollowUpMeeting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "followup_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pip_id", nullable = false)
    @JsonIgnore
    private Pip pip;

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "meeting_id", nullable = false)
    @JsonIgnoreProperties({ "manager", "employee", "createdBy" })
    private OneOnOneMeeting meeting;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    @Column(name = "status")
    private String status;

    @Column(name = "notes", columnDefinition = "text")
    private String notes;

    @Column(name = "reminder_sent", nullable = false)
    private Boolean reminderSent = false;

    @Column(name = "created_date")
    private Instant createdDate;

    @Column(name = "updated_date")
    private Instant updatedDate;

    public LocalDateTime getMeetingTime() {
        if (meeting == null || meeting.getMeetingDate() == null || meeting.getMeetingTime() == null) {
            return null;
        }
        return LocalDateTime.of(meeting.getMeetingDate(), meeting.getMeetingTime());
    }

    public void setMeetingTime(LocalDateTime meetingTime) {
        if (meetingTime == null) {
            this.scheduledDate = null;
            this.meeting = null;
            return;
        }
        if (this.meeting == null) {
            this.meeting = new OneOnOneMeeting();
        }
        this.meeting.setMeetingDate(meetingTime.toLocalDate());
        this.meeting.setMeetingTime(meetingTime.toLocalTime().withSecond(0).withNano(0));
        this.meeting.setDurationMinutes(this.meeting.getDurationMinutes() == null ? 30 : this.meeting.getDurationMinutes());
        this.meeting.setStatus(this.meeting.getStatus() == null ? "Scheduled" : this.meeting.getStatus());
        this.scheduledDate = meetingTime.toLocalDate();
    }
}
