package com.epms.backend.dto.selfassessmentform;

public record RetakeQuestionRequest(
        Long answerId,
        String comment
) {}
