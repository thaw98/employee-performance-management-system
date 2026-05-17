package com.epms.backend.dto.selfassessmentform;

import java.util.List;

public record SaveDraftRequest(
        List<AnswerRequest> answers,
        String employeeRemarks,
        String overallRemarks
) {}