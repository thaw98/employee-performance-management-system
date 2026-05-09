package com.epms.backend.dto;

import java.time.LocalDateTime;

public record NotificationDto(
        Long id,
        Long userId,
        String title,
        String message,
        String source,
        Long targetId,
        boolean read,
        LocalDateTime createdAt) {
}
