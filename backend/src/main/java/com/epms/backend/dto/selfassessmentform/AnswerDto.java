package com.epms.backend.dto.selfassessmentform;

public record AnswerDto(
        Long id,
        String questionText,
        Integer sortOrder,
        String yesNoAnswer,
        Integer rating,
        String remarks,
        String managerProposedYesNo,
        Integer managerProposedRating,
        String managerProposedComment,
        Boolean hrAdjustmentApproved,
        String finalApprovedYesNo,
        Integer finalApprovedRating
) {}