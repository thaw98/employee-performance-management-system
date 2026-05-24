package com.epms.backend.dto.faq;

import com.epms.backend.entity.FaqSupportStatus;
import java.time.LocalDateTime;

public record FaqSupportQuestionDto(
        Long id,
        Long submitterUserId,
        String submitterName,
        String submitterEmail,
        String departmentName,
        String category,
        String subject,
        String question,
        String answer,
        Long answeredByUserId,
        String answeredByName,
        FaqSupportStatus status,
        boolean published,
        LocalDateTime createdAt,
        LocalDateTime answeredAt,
        LocalDateTime publishedAt,
        LocalDateTime updatedAt) {
}
