package com.epms.backend.dto;

import java.time.Instant;

public record FeedbackChatMessageDto(
        Long id,
        Long feedbackId,
        Long authorId,
        String authorName,
        String content,
        Instant createdDate
) {}
