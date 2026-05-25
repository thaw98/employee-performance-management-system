package com.epms.backend.dto.selfassessmentform;

import com.epms.backend.entity.SelfAssessmentUnlockHrRejectReasonCode;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SelfAssessmentUnlockRejectRequest(
        @NotNull SelfAssessmentUnlockHrRejectReasonCode reasonCode,
        @Size(max = 2000) String reasonText
) {}
