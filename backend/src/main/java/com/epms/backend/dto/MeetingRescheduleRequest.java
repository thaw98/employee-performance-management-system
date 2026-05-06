package com.epms.backend.dto;

import java.time.Instant;

public record MeetingRescheduleRequest(
    String rescheduleReason,
    Instant proposedTime
) {}
