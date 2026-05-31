package com.epms.backend.service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.audit.AuditActionType;
import com.epms.backend.audit.AuditTargetType;
import com.epms.backend.dto.upwardfeedback.UpwardFeedbackCreateRequest;
import com.epms.backend.dto.upwardfeedback.UpwardFeedbackDto;
import com.epms.backend.dto.upwardfeedback.UpwardFeedbackHistoryDto;
import com.epms.backend.dto.upwardfeedback.UpwardFeedbackReplyDto;
import com.epms.backend.dto.upwardfeedback.UpwardFeedbackReplyRequest;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.EmployeeReportingHistory;
import com.epms.backend.entity.UpwardFeedback;
import com.epms.backend.entity.UpwardFeedbackEventType;
import com.epms.backend.entity.UpwardFeedbackHistory;
import com.epms.backend.entity.UpwardFeedbackReply;
import com.epms.backend.entity.UpwardFeedbackStatus;
import com.epms.backend.entity.User;
import com.epms.backend.repository.EmployeeReportingHistoryRepository;
import com.epms.backend.repository.UpwardFeedbackHistoryRepository;
import com.epms.backend.repository.UpwardFeedbackReplyRepository;
import com.epms.backend.repository.UpwardFeedbackRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class UpwardFeedbackService {

    private static final Long HR_ROLE_ID = 1L;
    private static final Long AUDIT_ROLE_ID = 5L;

    private final UpwardFeedbackRepository feedbackRepository;
    private final UpwardFeedbackReplyRepository replyRepository;
    private final UpwardFeedbackHistoryRepository historyRepository;
    private final EmployeeReportingHistoryRepository reportingHistoryRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    @Transactional
    public UpwardFeedbackDto createUpwardFeedback(UpwardFeedbackCreateRequest request, User currentUser) {
        if (!isEmployee(currentUser)) {
            throw new RuntimeException("Only employees can create upward feedback");
        }

        Employee employee = getEmployee(currentUser);
        Employee manager = resolveManager(employee);

        if (request.getMessage() == null || request.getMessage().isBlank()) {
            throw new RuntimeException("Message is required");
        }

        UpwardFeedback feedback = new UpwardFeedback();
        feedback.setEmployee(employee);
        feedback.setManager(manager);
        feedback.setMessage(request.getMessage());
        feedback.setStatus(UpwardFeedbackStatus.OPEN);
        feedback.setCreatedAt(Instant.now());
        feedback.setCreatedBy(currentUser);
        feedback = feedbackRepository.save(feedback);

        String metadata = createMetadata(feedback);
        auditService.record(
                AuditActionType.UPWARD_FEEDBACK_CREATED,
                AuditTargetType.CONTINUOUS_FEEDBACK,
                feedback.getId(),
                currentUser.getId(),
                currentUser.getRole().getId(),
                "Upward feedback created by " + employee.getEmployeeName() + " for manager " + manager.getEmployeeName(),
                metadata);

        recordHistory(feedback, employee, UpwardFeedbackEventType.CREATED,
                "Upward feedback created by " + employee.getEmployeeName());

        notifyManagerOnCreate(feedback);

        return toDto(feedback);
    }

    @Transactional
    public UpwardFeedbackReplyDto addReply(Long feedbackId, UpwardFeedbackReplyRequest request, User currentUser) {
        UpwardFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Upward feedback not found"));

        if (feedback.getStatus() == UpwardFeedbackStatus.CLOSED) {
            throw new RuntimeException("Cannot reply to a closed feedback thread");
        }

        if (isHr(currentUser) || isAudit(currentUser)) {
            throw new RuntimeException("HR and Audit users cannot reply to upward feedback");
        }

        Employee author = getEmployee(currentUser);
        boolean isParticipant = feedback.getEmployee().getId().equals(author.getId())
                || feedback.getManager().getId().equals(author.getId());
        if (!isParticipant) {
            throw new RuntimeException("Only thread participants can reply");
        }

        if (request.getMessage() == null || request.getMessage().isBlank()) {
            throw new RuntimeException("Message is required");
        }

        UpwardFeedbackReply reply = new UpwardFeedbackReply();
        reply.setFeedback(feedback);
        reply.setAuthor(author);
        reply.setMessage(request.getMessage());
        reply.setCreatedAt(Instant.now());
        reply = replyRepository.save(reply);

        feedback.setUpdatedAt(Instant.now());
        feedback.setUpdatedBy(currentUser);
        feedbackRepository.save(feedback);

        String metadata = "{\"feedbackId\":" + feedbackId + ",\"replyId\":" + reply.getId() + "}";
        auditService.record(
                AuditActionType.UPWARD_FEEDBACK_REPLY_ADDED,
                AuditTargetType.CONTINUOUS_FEEDBACK,
                feedback.getId(),
                currentUser.getId(),
                currentUser.getRole().getId(),
                "Reply added by " + author.getEmployeeName(),
                metadata);

        recordHistory(feedback, author, UpwardFeedbackEventType.REPLY_ADDED,
                "Reply added by " + author.getEmployeeName());

        notifyOnReply(feedback, author);

        return toReplyDto(reply);
    }

    @Transactional
    public UpwardFeedbackDto closeFeedback(Long feedbackId, User currentUser) {
        UpwardFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Upward feedback not found"));

        if (isHr(currentUser) || isAudit(currentUser)) {
            throw new RuntimeException("HR and Audit users cannot close upward feedback");
        }

        Employee actor = getEmployee(currentUser);
        boolean isParticipant = feedback.getEmployee().getId().equals(actor.getId())
                || feedback.getManager().getId().equals(actor.getId());
        if (!isParticipant) {
            throw new RuntimeException("Only thread participants can close feedback");
        }

        if (feedback.getStatus() == UpwardFeedbackStatus.CLOSED) {
            throw new RuntimeException("Feedback is already closed");
        }

        feedback.setStatus(UpwardFeedbackStatus.CLOSED);
        feedback.setClosedAt(Instant.now());
        feedback.setClosedBy(currentUser);
        feedback.setUpdatedAt(Instant.now());
        feedback.setUpdatedBy(currentUser);
        feedback = feedbackRepository.save(feedback);

        String metadata = createMetadata(feedback);
        auditService.record(
                AuditActionType.UPWARD_FEEDBACK_CLOSED,
                AuditTargetType.CONTINUOUS_FEEDBACK,
                feedback.getId(),
                currentUser.getId(),
                currentUser.getRole().getId(),
                "Upward feedback closed by " + actor.getEmployeeName(),
                metadata);

        recordHistory(feedback, actor, UpwardFeedbackEventType.CLOSED,
                "Feedback closed by " + actor.getEmployeeName());

        return toDto(feedback);
    }

    @Transactional(readOnly = true)
    public UpwardFeedbackDto getFeedbackDetail(Long feedbackId, User currentUser) {
        UpwardFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Upward feedback not found"));

        validateViewAccess(feedback, currentUser);

        UpwardFeedbackDto dto = toDto(feedback);
        dto.setReplies(getReplies(feedbackId));
        dto.setHistory(getHistory(feedbackId));
        return dto;
    }

    @Transactional(readOnly = true)
    public List<UpwardFeedbackDto> getMySentFeedback(User currentUser) {
        if (!isEmployee(currentUser)) {
            throw new RuntimeException("Only employees can view their sent upward feedback");
        }
        Employee employee = getEmployee(currentUser);
        List<UpwardFeedback> list = feedbackRepository.findByEmployeeIdOrderByCreatedAtDesc(employee.getId());
        return list.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UpwardFeedbackDto> getMyReceivedFeedback(User currentUser) {
        Employee employee = getEmployee(currentUser);
        List<UpwardFeedback> list = feedbackRepository.findByManagerIdOrderByCreatedAtDesc(employee.getId());
        return list.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UpwardFeedbackDto> listAll(User currentUser) {
        if (!isHr(currentUser) && !isAudit(currentUser)) {
            throw new RuntimeException("Access denied. Only HR and Audit can view all upward feedback.");
        }
        List<UpwardFeedback> list = feedbackRepository.findAllByOrderByCreatedAtDesc();
        return list.stream().map(this::toDto).collect(Collectors.toList());
    }

    private void validateViewAccess(UpwardFeedback feedback, User user) {
        if (isHr(user) || isAudit(user)) {
            return;
        }
        if (user.getEmployee() == null) {
            throw new RuntimeException("Access denied");
        }
        Long employeeId = user.getEmployee().getId();
        if (!feedback.getEmployee().getId().equals(employeeId)
                && !feedback.getManager().getId().equals(employeeId)) {
            throw new RuntimeException("Access denied");
        }
    }

    private Employee resolveManager(Employee employee) {
        Employee manager = null;
        var reportingOpt = reportingHistoryRepository.findByEmployee_IdAndCurrentTrue(employee.getId());
        if (reportingOpt.isPresent()) {
            manager = reportingOpt.get().getManager();
        } else if (employee.getManager() != null) {
            manager = employee.getManager();
        }

        if (manager == null) {
            throw new RuntimeException("No manager assigned. Cannot submit upward feedback.");
        }

        if (manager.getId().equals(employee.getId())) {
            throw new RuntimeException("Cannot submit upward feedback to yourself");
        }

        return manager;
    }

    private void recordHistory(UpwardFeedback feedback, Employee actor, UpwardFeedbackEventType eventType, String description) {
        UpwardFeedbackHistory history = new UpwardFeedbackHistory();
        history.setFeedback(feedback);
        history.setActor(actor);
        history.setEventType(eventType);
        history.setDescription(description);
        history.setCreatedAt(Instant.now());
        historyRepository.save(history);
    }

    private void notifyManagerOnCreate(UpwardFeedback feedback) {
        User recipient = feedback.getManager().getUserAccount();
        if (recipient != null) {
            notificationService.send(
                    recipient,
                    "New Upward Feedback",
                    feedback.getEmployee().getEmployeeName() + " has submitted upward feedback to you",
                    "CONTINUOUS_FEEDBACK",
                    feedback.getId());
            recordHistory(feedback, feedback.getEmployee(), UpwardFeedbackEventType.NOTIFICATION_SENT,
                    "Notification sent to manager " + feedback.getManager().getEmployeeName());
        }
    }

    private void notifyOnReply(UpwardFeedback feedback, Employee author) {
        boolean authorIsEmployee = feedback.getEmployee().getId().equals(author.getId());
        User recipient;
        String title;
        String message;

        if (authorIsEmployee) {
            recipient = feedback.getManager().getUserAccount();
            title = "New Reply on Upward Feedback";
            message = feedback.getEmployee().getEmployeeName() + " replied to their upward feedback";
        } else {
            recipient = feedback.getEmployee().getUserAccount();
            title = "New Reply from Manager";
            message = feedback.getManager().getEmployeeName() + " replied to your upward feedback";
        }

        if (recipient != null) {
            notificationService.send(
                    recipient,
                    title,
                    message,
                    "CONTINUOUS_FEEDBACK",
                    feedback.getId());
            recordHistory(feedback, author, UpwardFeedbackEventType.NOTIFICATION_SENT,
                    "Notification sent to " + (authorIsEmployee
                            ? feedback.getManager().getEmployeeName()
                            : feedback.getEmployee().getEmployeeName()));
        }
    }

    private List<UpwardFeedbackReplyDto> getReplies(Long feedbackId) {
        return replyRepository.findByFeedbackIdOrderByCreatedAtAsc(feedbackId)
                .stream()
                .map(this::toReplyDto)
                .collect(Collectors.toList());
    }

    private List<UpwardFeedbackHistoryDto> getHistory(Long feedbackId) {
        return historyRepository.findByFeedbackIdOrderByCreatedAtAsc(feedbackId)
                .stream()
                .map(this::toHistoryDto)
                .collect(Collectors.toList());
    }

    private UpwardFeedbackDto toDto(UpwardFeedback feedback) {
        return UpwardFeedbackDto.builder()
                .feedbackId(feedback.getId())
                .employeeId(feedback.getEmployee().getId())
                .employeeName(feedback.getEmployee().getEmployeeName())
                .employeeBusinessId(feedback.getEmployee().getEmployeeId())
                .managerId(feedback.getManager().getId())
                .managerName(feedback.getManager().getEmployeeName())
                .message(feedback.getMessage())
                .status(feedback.getStatus().name())
                .closedAt(feedback.getClosedAt())
                .closedByUserId(feedback.getClosedBy() != null ? feedback.getClosedBy().getId() : null)
                .createdAt(feedback.getCreatedAt())
                .updatedAt(feedback.getUpdatedAt())
                .createdByUserId(feedback.getCreatedBy() != null ? feedback.getCreatedBy().getId() : null)
                .updatedByUserId(feedback.getUpdatedBy() != null ? feedback.getUpdatedBy().getId() : null)
                .build();
    }

    private UpwardFeedbackReplyDto toReplyDto(UpwardFeedbackReply reply) {
        return UpwardFeedbackReplyDto.builder()
                .replyId(reply.getId())
                .feedbackId(reply.getFeedback().getId())
                .authorEmployeeId(reply.getAuthor().getId())
                .authorEmployeeName(reply.getAuthor().getEmployeeName())
                .message(reply.getMessage())
                .createdAt(reply.getCreatedAt())
                .build();
    }

    private UpwardFeedbackHistoryDto toHistoryDto(UpwardFeedbackHistory history) {
        return UpwardFeedbackHistoryDto.builder()
                .historyId(history.getId())
                .feedbackId(history.getFeedback().getId())
                .actorEmployeeId(history.getActor().getId())
                .actorEmployeeName(history.getActor().getEmployeeName())
                .eventType(history.getEventType().name())
                .description(history.getDescription())
                .createdAt(history.getCreatedAt())
                .build();
    }

    private String createMetadata(UpwardFeedback feedback) {
        return "{\"employeeId\":" + feedback.getEmployee().getId()
                + ",\"managerId\":" + feedback.getManager().getId()
                + ",\"status\":\"" + feedback.getStatus() + "\"}";
    }

    private Employee getEmployee(User user) {
        if (user.getEmployee() == null) {
            throw new RuntimeException("User does not have an associated employee record");
        }
        return user.getEmployee();
    }

    private boolean isEmployee(User user) {
        return user.getRole() != null
                && !HR_ROLE_ID.equals(user.getRole().getId())
                && !AUDIT_ROLE_ID.equals(user.getRole().getId());
    }

    private boolean isHr(User user) {
        return user.getRole() != null && HR_ROLE_ID.equals(user.getRole().getId());
    }

    private boolean isAudit(User user) {
        return user.getRole() != null && AUDIT_ROLE_ID.equals(user.getRole().getId());
    }
}
