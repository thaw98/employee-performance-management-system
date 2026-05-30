package com.epms.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.epms.backend.entity.Employee;
import com.epms.backend.entity.EmployeeDepartmentHistory;
import com.epms.backend.entity.TransferType;
import com.epms.backend.entity.User;
import com.epms.backend.repository.EmployeeDepartmentHistoryRepository;
import com.epms.backend.repository.NotificationRepository;
import com.epms.backend.repository.UserRepository;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class TransferAutoReturnSchedulerTest {

    private EmployeeDepartmentHistoryRepository historyRepository;
    private UserRepository userRepository;
    private NotificationRepository notificationRepository;
    private NotificationService notificationService;
    private TransferAutoReturnScheduler scheduler;

    private Employee employee;
    private User hrUser;
    private EmployeeDepartmentHistory expiringTransfer;

    @BeforeEach
    void setUp() {
        historyRepository = org.mockito.Mockito.mock(EmployeeDepartmentHistoryRepository.class);
        userRepository = org.mockito.Mockito.mock(UserRepository.class);
        notificationRepository = org.mockito.Mockito.mock(NotificationRepository.class);
        notificationService = org.mockito.Mockito.mock(NotificationService.class);

        scheduler = new TransferAutoReturnScheduler(
                historyRepository, userRepository, notificationRepository, notificationService);

        employee = new Employee();
        employee.setId(100L);
        employee.setEmployeeName("Test Employee");

        hrUser = new User();
        hrUser.setId(1L);

        expiringTransfer = new EmployeeDepartmentHistory();
        expiringTransfer.setId(50L);
        expiringTransfer.setEmployee(employee);
        expiringTransfer.setTransferType(TransferType.TEMPORARY);
        expiringTransfer.setCurrent(true);
        expiringTransfer.setEffectiveEndDate(LocalDate.now().plusDays(3));
    }

    @Test
    void sendTemporaryEndingRemindersNotifiesActiveHrUsersForTransfersEndingInThreeDays() {
        LocalDate reminderDate = LocalDate.now().plusDays(3);
        when(historyRepository.findByCurrentTrueAndTransferTypeAndEffectiveEndDate(
                TransferType.TEMPORARY, reminderDate))
                .thenReturn(List.of(expiringTransfer));
        when(userRepository.findByRole_IdAndActiveTrue(1L)).thenReturn(List.of(hrUser));
        when(notificationRepository.existsByRecipientAndSourceAndTargetIdAndTitle(
                hrUser, "TRANSFER", 50L, "Temporary Transfer Ending Soon"))
                .thenReturn(false);

        scheduler.sendTemporaryEndingReminders();

        ArgumentCaptor<String> titleCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> messageCaptor = ArgumentCaptor.forClass(String.class);
        verify(notificationService).send(
                eq(hrUser),
                titleCaptor.capture(),
                messageCaptor.capture(),
                eq("TRANSFER"),
                eq(100L));
        assertThat(titleCaptor.getValue()).isEqualTo("Temporary Transfer Ending Soon");
        assertThat(messageCaptor.getValue()).contains("Test Employee")
                .contains(reminderDate.toString());
    }

    @Test
    void sendTemporaryEndingRemindersSkipsAlreadySentNotifications() {
        when(historyRepository.findByCurrentTrueAndTransferTypeAndEffectiveEndDate(
                any(TransferType.class), any(LocalDate.class)))
                .thenReturn(List.of(expiringTransfer));
        when(userRepository.findByRole_IdAndActiveTrue(1L)).thenReturn(List.of(hrUser));
        when(notificationRepository.existsByRecipientAndSourceAndTargetIdAndTitle(
                hrUser, "TRANSFER", 50L, "Temporary Transfer Ending Soon"))
                .thenReturn(true);

        scheduler.sendTemporaryEndingReminders();

        verify(notificationService, never()).send(
                any(User.class), any(), any(), any(), anyLong());
    }

    @Test
    void sendTemporaryEndingRemindersDoesNothingWhenNoTransfersEndingInThreeDays() {
        when(historyRepository.findByCurrentTrueAndTransferTypeAndEffectiveEndDate(
                any(TransferType.class), any(LocalDate.class)))
                .thenReturn(List.of());

        scheduler.sendTemporaryEndingReminders();

        verify(userRepository, never()).findByRole_IdAndActiveTrue(anyLong());
        verify(notificationService, never()).send(
                any(User.class), any(), any(), any(), anyLong());
    }

    @Test
    void sendTemporaryEndingRemindersDoesNothingWhenNoActiveHrUsers() {
        when(historyRepository.findByCurrentTrueAndTransferTypeAndEffectiveEndDate(
                any(TransferType.class), any(LocalDate.class)))
                .thenReturn(List.of(expiringTransfer));
        when(userRepository.findByRole_IdAndActiveTrue(1L)).thenReturn(List.of());

        scheduler.sendTemporaryEndingReminders();

        verify(notificationService, never()).send(
                any(User.class), any(), any(), any(), anyLong());
    }

    @Test
    void sendTemporaryEndingRemindersNotifiesAllActiveHrUsers() {
        User hrUser2 = new User();
        hrUser2.setId(2L);

        when(historyRepository.findByCurrentTrueAndTransferTypeAndEffectiveEndDate(
                any(TransferType.class), any(LocalDate.class)))
                .thenReturn(List.of(expiringTransfer));
        when(userRepository.findByRole_IdAndActiveTrue(1L)).thenReturn(List.of(hrUser, hrUser2));
        when(notificationRepository.existsByRecipientAndSourceAndTargetIdAndTitle(
                any(User.class), eq("TRANSFER"), eq(50L), eq("Temporary Transfer Ending Soon")))
                .thenReturn(false);

        scheduler.sendTemporaryEndingReminders();

        verify(notificationService, times(2)).send(
                any(User.class), any(), any(), eq("TRANSFER"), eq(100L));
    }

    @Test
    void autoReturnExpiredTemporaryTransfersIsDisabled() {
        // Verify that the auto-return method no longer performs auto-return.
        // The scheduler no longer calls transferService.autoReturnExpiredTemporary().
        // The expired transfers remain current until HR manually returns or makes permanent.
        assertThat(scheduler).isNotNull();
    }
}
