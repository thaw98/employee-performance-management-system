package com.epms.backend.dto.faq;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record FaqSupportReplyRequest(
        @NotBlank @Size(max = 5000) String answer) {
}
