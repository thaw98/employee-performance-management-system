package com.epms.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.epms.backend.dto.NotificationDto;
import com.epms.backend.entity.Notification;
import com.epms.backend.entity.User;
import com.epms.backend.repository.NotificationRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

class NotificationServiceTest {

    private NotificationRepository notificationRepository;
    private NotificationService notificationService;
    private User recipient;

    @BeforeEach
    void setUp() {
        notificationRepository = org.mockito.Mockito.mock(NotificationRepository.class);
        notificationService = new NotificationService(
                notificationRepository,
                org.mockito.Mockito.mock(WebSocketNotificationService.class));
        recipient = new User();
        recipient.setId(7L);
    }

    @Test
    void getMyNotificationsAcceptsStatusFilter() {
        Pageable pageable = PageRequest.of(0, 10);
        when(notificationRepository.findAll(anyNotificationSpec(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(notification(1L, "MEETING", false)), pageable, 1));

        Page<NotificationDto> page = notificationService.getMyNotifications(recipient, pageable, "unread", null);

        assertThat(page.getContent()).extracting(NotificationDto::source).containsExactly("MEETING");
        verify(notificationRepository).findAll(anyNotificationSpec(), any(Pageable.class));
    }

    @Test
    void getMyNotificationsAcceptsSourceFilter() {
        Pageable pageable = PageRequest.of(0, 10);
        when(notificationRepository.findAll(anyNotificationSpec(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(notification(2L, "PIP", true)), pageable, 1));

        Page<NotificationDto> page = notificationService.getMyNotifications(recipient, pageable, "all", "PIP");

        assertThat(page.getContent()).extracting(NotificationDto::source).containsExactly("PIP");
    }

    @Test
    void getMyNotificationsPreservesRepositoryPaginationTotalsForCombinedFilters() {
        Pageable pageable = PageRequest.of(1, 2);
        when(notificationRepository.findAll(anyNotificationSpec(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(notification(3L, "SELF_ASSESSMENT_FORM", true)), pageable, 5));

        Page<NotificationDto> page = notificationService.getMyNotifications(
                recipient,
                pageable,
                "read",
                "SELF_ASSESSMENT_FORM");

        assertThat(page.getTotalElements()).isEqualTo(5);
        assertThat(page.getNumber()).isEqualTo(1);
        assertThat(page.getSize()).isEqualTo(2);
    }

    @Test
    void getMyNotificationsRejectsInvalidStatus() {
        assertThatThrownBy(() -> notificationService.getMyNotifications(recipient, PageRequest.of(0, 10), "archived", null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("status must be one of: all, unread, read");

        verify(notificationRepository, never()).findAll(anyNotificationSpec(), any(Pageable.class));
    }

    @Test
    void getMyNotificationsRejectsInvalidSource() {
        assertThatThrownBy(() -> notificationService.getMyNotifications(recipient, PageRequest.of(0, 10), "all", "GENERAL"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("source must be one of: APPRAISAL, KPI, 360_FEEDBACK, MEETING, PIP, SELF_ASSESSMENT_FORM");

        verify(notificationRepository, never()).findAll(anyNotificationSpec(), any(Pageable.class));
    }

    @SuppressWarnings("unchecked")
    private Specification<Notification> anyNotificationSpec() {
        return any(Specification.class);
    }

    private Notification notification(Long id, String source, boolean read) {
        Notification notification = new Notification();
        notification.setId(id);
        notification.setRecipient(recipient);
        notification.setTitle("Title");
        notification.setMessage("Message");
        notification.setSource(source);
        notification.setRead(read);
        notification.setCreatedAt(LocalDateTime.now());
        return notification;
    }
}
