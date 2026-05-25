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
        Integer finalApprovedRating,
        Boolean retakeRequested,
        String retakeRequestComment,
        String retakeYesNoAnswer,
        Integer retakeRating,
        String retakeReason,
        java.time.Instant retakeSubmittedAt,
        Boolean retakeApproved,
        Boolean managerForceChanged,
        String managerForceChangeReason,
        java.time.Instant managerForceChangedAt
) {}
