package com.epms.backend.dto.selfassessmentform;

public record AnswerRequest(
        Long id,
        String yesNoAnswer,
        Integer rating,
        String remarks
) {}