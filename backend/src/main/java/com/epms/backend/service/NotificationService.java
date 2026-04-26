package com.epms.backend.service;

import com.epms.backend.dto.NotificationDto;
import com.epms.backend.entity.Notification;
import com.epms.backend.entity.User;
import com.epms.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final WebSocketNotificationService webSocketNotificationService;

    @Transactional
    public NotificationDto send(User recipient, String title, String message) {
        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setTitle(title);
        notification.setMessage(message);
        Notification saved = notificationRepository.save(notification);
        NotificationDto dto = toDto(saved);
        webSocketNotificationService.sendNotification(recipient.getId(), dto);
        return dto;
    }

    @Transactional(readOnly = true)
    public Page<NotificationDto> getMyNotifications(User recipient, Pageable pageable) {
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(recipient, pageable)
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
                notification.isRead(),
                notification.getCreatedAt());
    }
}
