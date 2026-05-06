package com.epms.backend.dto;

import com.epms.backend.entity.MeetingStatus;
import java.time.Instant;

public record MeetingResponse(
    Long id,
    Long managerId,
    Long managerUserId,
    String managerName,
    Long employeeId,
    Long employeeUserId,
    String employeeName,
    String departmentName,
    String title,
    String description,
    Instant scheduledTime,
    Integer durationMinutes,
    MeetingStatus status,
    String rescheduleReason,
    String cancellationReason,
    Instant proposedTime,
    Instant actualStartTime,
    Instant actualEndTime,
    Instant createdDate
) {}
