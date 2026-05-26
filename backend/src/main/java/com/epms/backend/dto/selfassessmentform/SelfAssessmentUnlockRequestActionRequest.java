package com.epms.backend.dto.selfassessmentform;

import com.epms.backend.entity.SelfAssessmentUnlockReasonCode;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SelfAssessmentUnlockRequestActionRequest(
        @NotNull SelfAssessmentUnlockReasonCode reasonCode,
        @Size(max = 2000) String reasonText
) {}
