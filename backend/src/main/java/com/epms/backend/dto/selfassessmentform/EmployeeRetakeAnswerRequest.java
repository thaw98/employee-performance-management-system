package com.epms.backend.dto.selfassessmentform;

public record EmployeeRetakeAnswerRequest(
        Long answerId,
        String yesNoAnswer,
        Integer rating,
        String reason
) {}
