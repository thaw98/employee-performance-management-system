package com.epms.backend.dto.selfassessmentform;

public record SelfAssessmentAttemptAnswerDto(
        Long answerId,
        String questionText,
        Integer sortOrder,
        String yesNoAnswer,
        Integer rating,
        String remarks,
        String retakeReason,
        String managerForceChangeReason
) {}
