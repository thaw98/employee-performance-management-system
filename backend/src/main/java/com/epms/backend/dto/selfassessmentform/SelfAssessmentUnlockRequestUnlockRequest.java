package com.epms.backend.dto.selfassessmentform;

import com.epms.backend.entity.SelfAssessmentUnlockHrApproveReasonCode;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SelfAssessmentUnlockRequestUnlockRequest(
        @NotNull SelfAssessmentUnlockHrApproveReasonCode reasonCode,
        @Size(max = 2000) String reasonText
) {}
