package com.epms.backend.dto.selfassessmentform;

import java.util.List;

public record ManagerReviewRequest(
        String comments,
        List<ManagerAdjustmentRequest> adjustments,
        Boolean requiresHrReview,
        Boolean affectsCompensationOrPip,
        Boolean companyPolicyRequiresHrApproval
) {}