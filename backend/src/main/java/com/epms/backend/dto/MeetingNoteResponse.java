package com.epms.backend.dto;

import com.epms.backend.entity.MeetingNoteType;
import java.time.Instant;

public record MeetingNoteResponse(
    Long id,
    Long meetingId,
    Long authorId,
    String authorName,
    MeetingNoteType noteType,
    String content,
    Instant createdDate
) {}
