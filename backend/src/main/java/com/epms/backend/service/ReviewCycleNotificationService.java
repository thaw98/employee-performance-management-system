package com.epms.backend.service;

import com.epms.backend.entity.ReviewCycle;
import com.epms.backend.entity.User;
import com.epms.backend.repository.NotificationRepository;
import com.epms.backend.repository.ReviewCycleRepository;
import com.epms.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewCycleNotificationService {

    private static final String SOURCE = "360_FEEDBACK";
    private static final DateTimeFormatter DISPLAY_DATE = DateTimeFormatter.ofPattern("dd MMM yyyy");

    private final ReviewCycleRepository reviewCycleRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 0 9 * * *")
    @Transactional
    public void sendReviewCycleNotifications() {
        LocalDate today = LocalDate.now();
        notifyCycleStarts(today);
        notifyFeedbackDeadlineReminders(today.plusDays(1));
    }

    private void notifyCycleStarts(LocalDate today) {
        for (ReviewCycle cycle : reviewCycleRepository.findByRequiresEmployeeSubmissionTrueAndStartDate(today)) {
            String prefix = "Review cycle " + cycle.getId() + " started";
            String message = prefix + ": " + cycle.getName()
                    + ". You can begin giving 360 feedback until "
                    + cycle.getEndDate().format(DISPLAY_DATE) + ".";
            sendToEmployeesOnce("New Review Cycle Started", message, prefix);
        }
    }

    private void notifyFeedbackDeadlineReminders(LocalDate deadline) {
        for (ReviewCycle cycle : reviewCycleRepository.findByRequiresEmployeeSubmissionTrueAndEndDate(deadline)) {
            String prefix = "Feedback deadline reminder: cycle " + cycle.getId();
            String message = prefix + " ends tomorrow (" + cycle.getEndDate().format(DISPLAY_DATE)
                    + "). Please complete any remaining 360 feedback.";
            sendToEmployeesOnce("Feedback Deadline Tomorrow", message, prefix);
        }
    }

    private void sendToEmployeesOnce(String title, String message, String messagePrefix) {
        List<User> recipients = userRepository.findAll().stream()
                .filter(User::isActive)
                .filter(user -> user.getEmployee() != null)
                .toList();

        for (User recipient : recipients) {
            boolean alreadySent = notificationRepository
                    .findByRecipientAndSourceAndMessageStartingWith(recipient, SOURCE, messagePrefix)
                    .isPresent();
            if (!alreadySent) {
                notificationService.send(recipient, title, message, SOURCE);
            }
        }
    }
}
