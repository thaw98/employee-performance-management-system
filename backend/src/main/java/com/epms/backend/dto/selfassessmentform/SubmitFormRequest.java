package com.epms.backend.dto.selfassessmentform;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record SubmitFormRequest(
        @NotBlank(message = "Title is required") @Size(max = 500) String title,
        List<AnswerRequest> answers,
        String employeeRemarks,
        String overallRemarks
) {}