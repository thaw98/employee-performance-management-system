package com.epms.backend.dto;

import java.util.List;

public record PipFollowUpMeetingResponse(
        MeetingResponse meeting,
        List<MeetingNoteResponse> notes
) {}
