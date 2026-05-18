package com.epms.backend.dto.selfassessmentform;

import java.util.List;

public record EmployeeRetakeSubmitRequest(
        List<EmployeeRetakeAnswerRequest> answers
) {}
