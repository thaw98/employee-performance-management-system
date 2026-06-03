package com.epms.backend.dto.selfassessmentform;

public record HrRejectManagerReviewResponse(
        SelfAssessmentFormDto form,
        Long archiveSnapshotId
) {}
