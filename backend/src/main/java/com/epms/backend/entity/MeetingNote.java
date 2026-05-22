package com.epms.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "meeting_note")
@Getter
@Setter
@NoArgsConstructor
public class MeetingNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "note_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meeting_id", nullable = false)
    private Meeting meeting;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private Employee author;

    @Enumerated(EnumType.STRING)
    @Column(name = "note_type", nullable = false)
    private MeetingNoteType noteType;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "created_date", nullable = false, updatable = false)
    private Instant createdDate = Instant.now();

    @Column(name = "updated_date")
    private Instant updatedDate = Instant.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedDate = Instant.now();
    }
}
