package com.epms.backend.dto.selfassessmentform;

import java.util.List;

public record SubmitFormRequest(
        List<AnswerRequest> answers,
        String employeeRemarks,
        String overallRemarks
) {}