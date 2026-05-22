package com.epms.backend.dto;

import java.time.Instant;

public record MeetingRequest(
    Long employeeId,
    String title,
    String description,
    Instant scheduledTime,
    Integer durationMinutes
) {}
