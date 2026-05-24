package com.epms.backend.dto.faq;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record FaqSupportQuestionRequest(
        @NotBlank @Size(max = 50) String category,
        @NotBlank @Size(max = 255) String subject,
        @NotBlank @Size(max = 3000) String question) {
}
