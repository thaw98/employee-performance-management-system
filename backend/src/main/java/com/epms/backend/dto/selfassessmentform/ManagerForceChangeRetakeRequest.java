package com.epms.backend.dto.selfassessmentform;

import java.util.List;

public record ManagerForceChangeRetakeRequest(
        List<ManagerForceChangeRetakeAnswerRequest> answers,
        String comments
) {}
