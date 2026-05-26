package com.epms.backend.dto.selfassessmentform;

public record ManagerForceChangeRetakeAnswerRequest(
        Long answerId,
        String finalYesNoAnswer,
        Integer finalRating,
        String reason
) {}
