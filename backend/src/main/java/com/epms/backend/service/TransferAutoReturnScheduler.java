package com.epms.backend.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.entity.EmployeeDepartmentHistory;
import com.epms.backend.entity.TransferType;
import com.epms.backend.entity.User;
import com.epms.backend.repository.EmployeeDepartmentHistoryRepository;
import com.epms.backend.repository.NotificationRepository;
import com.epms.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class TransferAutoReturnScheduler {

    private static final String NOTIFICATION_SOURCE = "TRANSFER";

    private final EmployeeDepartmentHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    /**
     * Auto-return of expired temporary transfers is disabled per feature update.
     * Expired temporary transfers remain current until HR manually returns or makes permanent.
     */

    @Scheduled(cron = "0 5 0 * * *")
    @Transactional
    public void sendTemporaryEndingReminders() {
        LocalDate reminderDate = LocalDate.now().plusDays(3);
        List<EmployeeDepartmentHistory> upcomingEndings =
            historyRepository.findByCurrentTrueAndTransferTypeAndEffectiveEndDate(TransferType.TEMPORARY, reminderDate);

        if (upcomingEndings.isEmpty()) {
            return;
        }

        List<User> hrUsers = userRepository.findByRole_IdAndActiveTrue(1L);
        if (hrUsers.isEmpty()) {
            return;
        }

        for (EmployeeDepartmentHistory transfer : upcomingEndings) {
            String title = "Temporary Transfer Ending Soon";
            String message = String.format(
                "Temporary transfer for employee %s will end on %s. Please take necessary action (return or make permanent).",
                transfer.getEmployee().getEmployeeName(),
                transfer.getEffectiveEndDate().toString()
            );

            for (User hrUser : hrUsers) {
                boolean alreadySent = notificationRepository.existsByRecipientAndSourceAndTargetIdAndTitle(
                    hrUser, NOTIFICATION_SOURCE, transfer.getId(), title);
                if (!alreadySent) {
                    try {
                        notificationService.send(hrUser, title, message, NOTIFICATION_SOURCE, transfer.getEmployee().getId());
                        log.info("Sent temp-ending reminder to HR user {} for transfer {} (employee {})",
                            hrUser.getId(), transfer.getId(), transfer.getEmployee().getId());
                    } catch (Exception ex) {
                        log.warn("Failed to send temp-ending reminder for transfer {} to HR user {}: {}",
                            transfer.getId(), hrUser.getId(), ex.getMessage());
                    }
                }
            }
        }
    }
}
