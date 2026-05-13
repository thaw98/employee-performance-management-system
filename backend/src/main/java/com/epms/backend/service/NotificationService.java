package com.epms.backend.service;

import com.epms.backend.dto.NotificationDto;
import com.epms.backend.entity.Notification;
import com.epms.backend.entity.User;
import com.epms.backend.repository.NotificationRepository;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final Set<String> VALID_STATUSES = Set.of("all", "unread", "read");
    private static final Set<String> VALID_SOURCES = Set.of(
            "APPRAISAL",
            "KPI",
            "360_FEEDBACK",
            "MEETING",
            "PIP",
            "SELF_ASSESSMENT_FORM");

    private final NotificationRepository notificationRepository;
    private final WebSocketNotificationService webSocketNotificationService;

    @Transactional
    public NotificationDto send(User recipient, String title, String message) {
        return send(recipient, title, message, "GENERAL");
    }

    @Transactional
    public NotificationDto send(User recipient, String title, String message, String source) {
        return send(recipient, title, message, source, null);
    }

    @Transactional
    public NotificationDto send(User recipient, String title, String message, String source, Long targetId) {
        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setSource(source == null || source.isBlank() ? "GENERAL" : source);
        notification.setTargetId(targetId);
        Notification saved = notificationRepository.save(notification);
        NotificationDto dto = toDto(saved);
        webSocketNotificationService.sendNotification(recipient.getId(), dto);
        return dto;
    }

    @Transactional(readOnly = true)
    public Page<NotificationDto> getMyNotifications(User recipient, Pageable pageable) {
        return getMyNotifications(recipient, pageable, "all", null);
    }

    @Transactional(readOnly = true)
    public Page<NotificationDto> getMyNotifications(User recipient, Pageable pageable, String status, String source) {
        String normalizedStatus = normalizeStatus(status);
        String normalizedSource = normalizeSource(source);

        Specification<Notification> spec = belongsTo(recipient);
        if ("unread".equals(normalizedStatus)) {
            spec = spec.and((root, query, criteriaBuilder) -> criteriaBuilder.isFalse(root.get("read")));
        } else if ("read".equals(normalizedStatus)) {
            spec = spec.and((root, query, criteriaBuilder) -> criteriaBuilder.isTrue(root.get("read")));
        }

        if (normalizedSource != null) {
            spec = spec.and((root, query, criteriaBuilder) -> criteriaBuilder.equal(root.get("source"), normalizedSource));
        }

        return notificationRepository.findAll(spec, pageable)
                .map(this::toDto);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(User recipient) {
        return notificationRepository.countByRecipientAndReadFalse(recipient);
    }

    @Transactional
    public NotificationDto markAsRead(User recipient, Long id) {
        Notification notification = notificationRepository.findByIdAndRecipient(id, recipient)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setRead(true);
        return toDto(notificationRepository.save(notification));
    }

    @Transactional
    public void markAllAsRead(User recipient) {
        notificationRepository.findByRecipientAndReadFalse(recipient)
                .forEach(notification -> notification.setRead(true));
    }

    public NotificationDto toDto(Notification notification) {
        return new NotificationDto(
                notification.getId(),
                notification.getRecipient().getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getSource(),
                notification.getTargetId(),
                notification.isRead(),
                notification.getCreatedAt());
    }

    private Specification<Notification> belongsTo(User recipient) {
        return (root, query, criteriaBuilder) -> criteriaBuilder.equal(root.get("recipient"), recipient);
    }

    private String normalizeStatus(String status) {
        String normalized = status == null || status.isBlank() ? "all" : status.trim().toLowerCase();
        if (!VALID_STATUSES.contains(normalized)) {
            throw new IllegalArgumentException("status must be one of: all, unread, read");
        }
        return normalized;
    }

    private String normalizeSource(String source) {
        if (source == null || source.isBlank()) {
            return null;
        }

        String normalized = source.trim().toUpperCase();
        if (!VALID_SOURCES.contains(normalized)) {
            throw new IllegalArgumentException(
                    "source must be one of: APPRAISAL, KPI, 360_FEEDBACK, MEETING, PIP, SELF_ASSESSMENT_FORM");
        }
        return normalized;
    }
}
