package com.epms.backend.dto.selfassessmentform;

import java.util.List;

public record ManagerRetakeRequest(
        String comments,
        List<RetakeQuestionRequest> retakeRequests
) {}
