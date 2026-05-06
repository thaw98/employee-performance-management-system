package com.epms.backend.dto;

import com.epms.backend.entity.MeetingStatus;

public record MeetingStatusUpdateRequest(
    MeetingStatus status
) {}
