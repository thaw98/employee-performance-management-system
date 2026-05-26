package com.epms.backend.dto.pip;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MeetingScheduleRequest {
    private LocalDateTime meetingTime;
    private LocalDateTime startMeetingTime;
    private LocalDateTime endMeetingTime;
}
