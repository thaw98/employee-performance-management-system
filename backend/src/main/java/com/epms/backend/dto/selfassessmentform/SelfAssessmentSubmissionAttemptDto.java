package com.epms.backend.dto.selfassessmentform;

import java.time.Instant;
import java.util.List;

public record SelfAssessmentSubmissionAttemptDto(
        int attemptNumber,
        Instant submittedAt,
        String retakeReason,
        List<SelfAssessmentAttemptAnswerDto> answers
) {}
