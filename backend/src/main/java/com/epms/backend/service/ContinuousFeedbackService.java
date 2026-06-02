package com.epms.backend.service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;

import com.epms.backend.audit.AuditActionType;
import com.epms.backend.audit.AuditTargetType;
import com.epms.backend.dto.MeetingRequest;
import com.epms.backend.dto.MeetingResponse;
import com.epms.backend.dto.continuousfeedback.ContinuousFeedbackActionItemDto;
import com.epms.backend.dto.continuousfeedback.ContinuousFeedbackActionItemRequest;
import com.epms.backend.dto.continuousfeedback.ContinuousFeedbackActionItemStatusUpdateRequest;
import com.epms.backend.dto.continuousfeedback.ContinuousFeedbackCommentDto;
import com.epms.backend.dto.continuousfeedback.ContinuousFeedbackCommentRequest;
import com.epms.backend.dto.continuousfeedback.ContinuousFeedbackCreatePipRequest;
import com.epms.backend.dto.continuousfeedback.ContinuousFeedbackCreateRequest;
import com.epms.backend.dto.continuousfeedback.ContinuousFeedbackDashboardDto;
import com.epms.backend.dto.continuousfeedback.ContinuousFeedbackDto;
import com.epms.backend.dto.continuousfeedback.ContinuousFeedbackEvidenceDto;
import com.epms.backend.dto.continuousfeedback.ContinuousFeedbackListResponseDto;
import com.epms.backend.dto.continuousfeedback.ContinuousFeedbackPipWarningDto;
import com.epms.backend.dto.continuousfeedback.ContinuousFeedbackUpdatePrivateNoteRequest;
import com.epms.backend.dto.continuousfeedback.ContinuousFeedbackUpdateScheduledRequest;
import com.epms.backend.dto.continuousfeedback.CreateFollowUpMeetingFromFeedbackRequest;
import com.epms.backend.dto.pip.PipCreateRequest;
import com.epms.backend.entity.ContinuousFeedback;
import com.epms.backend.entity.ContinuousFeedbackActionItem;
import com.epms.backend.entity.ContinuousFeedbackActionItemStatus;
import com.epms.backend.entity.ContinuousFeedbackCategory;
import com.epms.backend.entity.ContinuousFeedbackComment;
import com.epms.backend.entity.ContinuousFeedbackCommentType;
import com.epms.backend.entity.ContinuousFeedbackMeetingLink;
import com.epms.backend.entity.ContinuousFeedbackPipLink;
import com.epms.backend.entity.ContinuousFeedbackVisibilityStatus;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.EmployeeReportingHistory;
import com.epms.backend.entity.Meeting;
import com.epms.backend.entity.Pip;
import com.epms.backend.entity.User;
import com.epms.backend.repository.ContinuousFeedbackActionItemRepository;
import com.epms.backend.repository.ContinuousFeedbackCommentRepository;
import com.epms.backend.repository.ContinuousFeedbackMeetingLinkRepository;
import com.epms.backend.repository.ContinuousFeedbackPipLinkRepository;
import com.epms.backend.repository.ContinuousFeedbackRepository;
import com.epms.backend.repository.EmployeeReportingHistoryRepository;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.MeetingRepository;
import com.epms.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContinuousFeedbackService {

    private static final Long MANAGER_ROLE_ID = 2L;
    private static final Long TEAM_HEAD_ROLE_ID = 3L;
    private static final Long HR_ROLE_ID = 1L;
    private static final Long AUDIT_ROLE_ID = 5L;
    private static final long PIP_WARNING_THRESHOLD = 3;
    private static final long PIP_WARNING_DAYS = 30;
    private static final List<String> NEGATIVE_CATEGORIES = List.of("IMPROVEMENT_NEEDED", "PERFORMANCE_RISK");

    private final ContinuousFeedbackRepository feedbackRepository;
    private final ContinuousFeedbackActionItemRepository actionItemRepository;
    private final ContinuousFeedbackCommentRepository commentRepository;
    private final ContinuousFeedbackMeetingLinkRepository meetingLinkRepository;
    private final ContinuousFeedbackPipLinkRepository pipLinkRepository;
    private final EmployeeRepository employeeRepository;
    private final EmployeeReportingHistoryRepository reportingHistoryRepository;
    private final UserRepository userRepository;
    private final MeetingRepository meetingRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final MeetingService meetingService;
    private final PipService pipService;

    @Transactional
    public ContinuousFeedbackDto createFeedback(ContinuousFeedbackCreateRequest request, User currentUser) {
        validateManager(currentUser);

        Employee manager = getManagerEmployee(currentUser);
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        validateManagerEmployeeRelationship(manager, employee);

        ContinuousFeedbackCategory category = parseCategory(request.getCategory());
        String publishMode = request.getPublishMode() != null ? request.getPublishMode().toUpperCase() : "IMMEDIATE";

        if ("IMMEDIATE".equals(publishMode) && (request.getFeedbackMessage() == null || request.getFeedbackMessage().isBlank())) {
            throw new RuntimeException("Feedback message is required when sharing immediately");
        }

        if ("SCHEDULED".equals(publishMode) && request.getScheduledPublishAt() == null) {
            throw new RuntimeException("Scheduled publish date is required when using scheduled mode");
        }

        if ("SCHEDULED".equals(publishMode) && request.getScheduledPublishAt().isBefore(Instant.now())) {
            throw new RuntimeException("Scheduled publish date must be in the future");
        }

        ContinuousFeedback feedback = new ContinuousFeedback();
        feedback.setEmployee(employee);
        feedback.setManager(manager);
        feedback.setCategory(category);
        feedback.setFeedbackMessage(request.getFeedbackMessage());
        feedback.setPrivateManagerNote(request.getPrivateManagerNote());
        feedback.setSupportingEvidence(true);
        feedback.setCreatedAt(Instant.now());
        feedback.setCreatedBy(currentUser);

        switch (publishMode) {
            case "IMMEDIATE":
                feedback.setVisibilityStatus(ContinuousFeedbackVisibilityStatus.SHARED);
                feedback.setShared(true);
                feedback.setSharedAt(Instant.now());
                break;
            case "SCHEDULED":
                feedback.setVisibilityStatus(ContinuousFeedbackVisibilityStatus.SCHEDULED);
                feedback.setScheduledPublishAt(request.getScheduledPublishAt());
                feedback.setScheduledBy(currentUser);
                break;
            default: // PRIVATE
                feedback.setVisibilityStatus(ContinuousFeedbackVisibilityStatus.PRIVATE_NOTE);
                break;
        }

        feedback = feedbackRepository.save(feedback);

        String actionType;
        if ("SCHEDULED".equals(publishMode)) {
            actionType = AuditActionType.CONTINUOUS_FEEDBACK_SCHEDULED;
        } else {
            actionType = AuditActionType.CONTINUOUS_FEEDBACK_CREATED;
        }

        String metadata = createMetadata(feedback);
        auditService.record(
                actionType,
                AuditTargetType.CONTINUOUS_FEEDBACK,
                feedback.getId(),
                currentUser.getId(),
                currentUser.getRole().getId(),
                "Continuous feedback created for employee " + employee.getEmployeeName(),
                metadata);

        if (feedback.isShared()) {
            notifyEmployeeOnShare(feedback);
            checkPipWarning(feedback, currentUser);
        }

        return toDto(feedback, currentUser);
    }

    @Transactional
    public ContinuousFeedbackDto updatePrivateNote(Long feedbackId, ContinuousFeedbackUpdatePrivateNoteRequest request, User currentUser) {
        ContinuousFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Continuous feedback not found"));

        validateFeedbackManager(feedback, currentUser);

        if (feedback.isShared()) {
            throw new RuntimeException("Cannot edit private note on shared feedback");
        }

        if (feedback.getVisibilityStatus() == ContinuousFeedbackVisibilityStatus.CANCELLED) {
            throw new RuntimeException("Cannot edit cancelled feedback");
        }

        String beforeData = feedback.getPrivateManagerNote();
        feedback.setPrivateManagerNote(request.getPrivateManagerNote());
        feedback.setUpdatedAt(Instant.now());
        feedback.setUpdatedBy(currentUser);
        feedback = feedbackRepository.save(feedback);

        auditService.record(
                AuditActionType.CONTINUOUS_FEEDBACK_PRIVATE_NOTE_UPDATED,
                AuditTargetType.CONTINUOUS_FEEDBACK,
                feedback.getId(),
                currentUser.getId(),
                currentUser.getRole().getId(),
                "Private note updated for feedback " + feedback.getId(),
                createMetadata(feedback),
                beforeData,
                request.getPrivateManagerNote());

        return toDto(feedback, currentUser);
    }

    @Transactional
    public ContinuousFeedbackDto shareFeedback(Long feedbackId, User currentUser) {
        ContinuousFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Continuous feedback not found"));

        validateFeedbackManager(feedback, currentUser);

        if (feedback.isShared()) {
            throw new RuntimeException("Feedback is already shared");
        }

        if (feedback.getVisibilityStatus() == ContinuousFeedbackVisibilityStatus.CANCELLED) {
            throw new RuntimeException("Cannot share cancelled feedback");
        }

        if (feedback.getFeedbackMessage() == null || feedback.getFeedbackMessage().isBlank()) {
            throw new RuntimeException("Feedback message is required before sharing");
        }

        feedback.setShared(true);
        feedback.setSharedAt(Instant.now());
        feedback.setVisibilityStatus(ContinuousFeedbackVisibilityStatus.SHARED);
        feedback.setUpdatedAt(Instant.now());
        feedback.setUpdatedBy(currentUser);
        feedback = feedbackRepository.save(feedback);

        auditService.record(
                AuditActionType.CONTINUOUS_FEEDBACK_SHARED,
                AuditTargetType.CONTINUOUS_FEEDBACK,
                feedback.getId(),
                currentUser.getId(),
                currentUser.getRole().getId(),
                "Feedback shared with employee " + feedback.getEmployee().getEmployeeName(),
                createMetadata(feedback));

        notifyEmployeeOnShare(feedback);
        checkPipWarning(feedback, currentUser);

        return toDto(feedback, currentUser);
    }

    @Transactional
    public ContinuousFeedbackDto updateScheduledFeedback(Long feedbackId, ContinuousFeedbackUpdateScheduledRequest request, User currentUser) {
        ContinuousFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Continuous feedback not found"));

        validateFeedbackManager(feedback, currentUser);

        if (feedback.getVisibilityStatus() != ContinuousFeedbackVisibilityStatus.SCHEDULED) {
            throw new RuntimeException("Feedback is not in scheduled status");
        }

        if (request.getCategory() != null) {
            feedback.setCategory(parseCategory(request.getCategory()));
        }
        if (request.getFeedbackMessage() != null) {
            feedback.setFeedbackMessage(request.getFeedbackMessage());
        }
        if (request.getPrivateManagerNote() != null) {
            feedback.setPrivateManagerNote(request.getPrivateManagerNote());
        }
        if (request.getScheduledPublishAt() != null) {
            if (request.getScheduledPublishAt().isBefore(Instant.now())) {
                throw new RuntimeException("Scheduled publish date must be in the future");
            }
            feedback.setScheduledPublishAt(request.getScheduledPublishAt());
        }
        feedback.setUpdatedAt(Instant.now());
        feedback.setUpdatedBy(currentUser);
        feedback = feedbackRepository.save(feedback);

        auditService.record(
                AuditActionType.CONTINUOUS_FEEDBACK_SCHEDULE_UPDATED,
                AuditTargetType.CONTINUOUS_FEEDBACK,
                feedback.getId(),
                currentUser.getId(),
                currentUser.getRole().getId(),
                "Scheduled feedback " + feedback.getId() + " updated",
                createMetadata(feedback));

        return toDto(feedback, currentUser);
    }

    @Transactional
    public ContinuousFeedbackDto cancelScheduledFeedback(Long feedbackId, User currentUser) {
        ContinuousFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Continuous feedback not found"));

        validateFeedbackManager(feedback, currentUser);

        if (feedback.getVisibilityStatus() != ContinuousFeedbackVisibilityStatus.SCHEDULED) {
            throw new RuntimeException("Feedback is not in scheduled status");
        }

        feedback.setVisibilityStatus(ContinuousFeedbackVisibilityStatus.CANCELLED);
        feedback.setCancelledAt(Instant.now());
        feedback.setCancelledBy(currentUser);
        feedback.setUpdatedAt(Instant.now());
        feedback.setUpdatedBy(currentUser);
        feedback = feedbackRepository.save(feedback);

        auditService.record(
                AuditActionType.CONTINUOUS_FEEDBACK_SCHEDULE_CANCELLED,
                AuditTargetType.CONTINUOUS_FEEDBACK,
                feedback.getId(),
                currentUser.getId(),
                currentUser.getRole().getId(),
                "Scheduled feedback " + feedback.getId() + " cancelled",
                createMetadata(feedback));

        return toDto(feedback, currentUser);
    }

    @Transactional
    public void processScheduledFeedback() {
        List<ContinuousFeedback> dueList = feedbackRepository.findDueScheduledFeedback(
                ContinuousFeedbackVisibilityStatus.SCHEDULED, Instant.now());

        for (ContinuousFeedback feedback : dueList) {
            try {
                if (feedback.getFeedbackMessage() == null || feedback.getFeedbackMessage().isBlank()) {
                    log.warn("Scheduled feedback {} has no message, skipping auto-publish", feedback.getId());
                    continue;
                }

                feedback.setShared(true);
                feedback.setSharedAt(Instant.now());
                feedback.setVisibilityStatus(ContinuousFeedbackVisibilityStatus.SHARED);
                feedbackRepository.save(feedback);

                User systemUser = feedback.getCreatedBy();

                auditService.record(
                        AuditActionType.CONTINUOUS_FEEDBACK_AUTO_PUBLISHED,
                        AuditTargetType.CONTINUOUS_FEEDBACK,
                        feedback.getId(),
                        systemUser != null ? systemUser.getId() : null,
                        systemUser != null && systemUser.getRole() != null ? systemUser.getRole().getId() : null,
                        "Scheduled feedback auto-published for employee " + feedback.getEmployee().getEmployeeName(),
                        createMetadata(feedback));

                notifyEmployeeOnShare(feedback);
                checkPipWarning(feedback, systemUser != null ? systemUser : feedback.getManager().getUserAccount());

                log.info("Auto-published scheduled feedback {} for employee {}", feedback.getId(), feedback.getEmployee().getId());
            } catch (Exception e) {
                log.error("Error auto-publishing scheduled feedback {}: {}", feedback.getId(), e.getMessage());
            }
        }
    }

    @Transactional(readOnly = true)
    public ContinuousFeedbackDto getFeedbackDetail(Long feedbackId, User currentUser) {
        ContinuousFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Continuous feedback not found"));

        validateAccess(feedback, currentUser);

        List<ContinuousFeedbackActionItem> actionItems = actionItemRepository.findByFeedbackIdOrderByCreatedAtDesc(feedbackId);
        List<ContinuousFeedbackComment> comments;

        if (isEmployee(currentUser)) {
            comments = commentRepository.findByFeedbackIdAndVisibleToEmployeeTrueOrderByCreatedAtAsc(feedbackId);
        } else {
            comments = commentRepository.findByFeedbackIdOrderByCreatedAtAsc(feedbackId);
        }

        ContinuousFeedbackDto dto = toDto(feedback, currentUser);
        dto.setActionItems(actionItems.stream().map(this::toActionItemDto).collect(Collectors.toList()));
        dto.setComments(comments.stream().map(this::toCommentDto).collect(Collectors.toList()));
        return dto;
    }

    @Transactional(readOnly = true)
    public ContinuousFeedbackListResponseDto getMyFeedback(
            User currentUser,
            int page,
            int size,
            String search,
            String category,
            Boolean acknowledged) {
        Employee employee = getEmployee(currentUser);
        Long employeeId = employee.getId();

        Specification<ContinuousFeedback> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("employee").get("id"), employeeId));
            predicates.add(cb.isTrue(root.get("shared")));

            if (category != null && !category.isBlank() && !"ALL".equalsIgnoreCase(category)) {
                predicates.add(cb.equal(root.get("category"), parseCategory(category)));
            }
            if (acknowledged != null) {
                predicates.add(cb.equal(root.get("acknowledged"), acknowledged));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("manager").get("employeeName")), pattern),
                        cb.like(cb.lower(cb.coalesce(root.get("feedbackMessage"), "")), pattern)));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ContinuousFeedback> feedbackPage = feedbackRepository.findAll(spec, pageable);

        List<ContinuousFeedbackDto> content = feedbackPage.getContent().stream()
                .map(f -> toDto(f, currentUser))
                .collect(Collectors.toList());

        return ContinuousFeedbackListResponseDto.builder()
                .content(content)
                .page(feedbackPage.getNumber())
                .size(feedbackPage.getSize())
                .totalElements(feedbackPage.getTotalElements())
                .totalPages(feedbackPage.getTotalPages())
                .totalShared(feedbackRepository.countByEmployeeIdAndSharedTrue(employeeId))
                .pendingAcknowledgment(feedbackRepository.countByEmployeeIdAndSharedTrueAndAcknowledgedFalse(employeeId))
                .build();
    }

    @Transactional(readOnly = true)
    public List<ContinuousFeedbackDto> getTeamFeedback(User currentUser) {
        List<ContinuousFeedback> feedbackList;
        if (isHr(currentUser) || isAudit(currentUser)) {
            feedbackList = feedbackRepository.findAll().stream()
                    .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                    .collect(Collectors.toList());
        } else {
            validateManager(currentUser);
            Employee manager = getManagerEmployee(currentUser);
            feedbackList = feedbackRepository.findByManagerIdOrderByCreatedAtDesc(manager.getId());
        }
        return feedbackList.stream()
                .map(f -> toDto(f, currentUser))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ContinuousFeedbackDto> getEmployeeFeedback(Long employeeId, User currentUser) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        if (isEmployee(currentUser)) {
            Employee self = getEmployee(currentUser);
            if (!self.getId().equals(employeeId)) {
                throw new RuntimeException("Access denied");
            }
            List<ContinuousFeedback> feedbackList = feedbackRepository.findSharedByEmployeeId(employeeId);
            return feedbackList.stream().map(f -> toDto(f, currentUser)).collect(Collectors.toList());
        }

        List<ContinuousFeedback> feedbackList = feedbackRepository.findByEmployeeIdOrderByCreatedAtDesc(employeeId);
        return feedbackList.stream().map(f -> toDto(f, currentUser)).collect(Collectors.toList());
    }

    @Transactional
    public ContinuousFeedbackDto acknowledgeFeedback(Long feedbackId, User currentUser) {
        ContinuousFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Continuous feedback not found"));

        Employee employee = getEmployee(currentUser);
        if (!feedback.getEmployee().getId().equals(employee.getId())) {
            throw new RuntimeException("You can only acknowledge your own feedback");
        }

        if (!feedback.isShared()) {
            throw new RuntimeException("Cannot acknowledge feedback that has not been shared");
        }

        if (feedback.isAcknowledged()) {
            throw new RuntimeException("Feedback is already acknowledged");
        }

        feedback.setAcknowledged(true);
        feedback.setAcknowledgedAt(Instant.now());
        feedback = feedbackRepository.save(feedback);

        auditService.record(
                AuditActionType.CONTINUOUS_FEEDBACK_ACKNOWLEDGED,
                AuditTargetType.CONTINUOUS_FEEDBACK,
                feedback.getId(),
                currentUser.getId(),
                currentUser.getRole().getId(),
                "Employee acknowledged feedback " + feedback.getId(),
                createMetadata(feedback));

        notifyManagerOnAcknowledge(feedback, currentUser);

        return toDto(feedback, currentUser);
    }

    @Transactional
    public ContinuousFeedbackActionItemDto addActionItem(Long feedbackId, ContinuousFeedbackActionItemRequest request, User currentUser) {
        ContinuousFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Continuous feedback not found"));

        if (!isManager(currentUser)) {
            throw new RuntimeException("Only managers can add action items");
        }

        if (request.getDescription() == null || request.getDescription().isBlank()) {
            throw new RuntimeException("Action item description is required");
        }

        ContinuousFeedbackActionItem actionItem = new ContinuousFeedbackActionItem();
        actionItem.setFeedback(feedback);
        actionItem.setDescription(request.getDescription());
        actionItem.setDueDate(request.getDueDate());
        actionItem.setStatus(ContinuousFeedbackActionItemStatus.OPEN);
        actionItem.setCreatedAt(Instant.now());
        actionItem = actionItemRepository.save(actionItem);

        String metadata = "{\"actionItemId\":" + actionItem.getId()
                + ",\"employeeId\":" + feedback.getEmployee().getId()
                + ",\"dueDate\":\"" + (request.getDueDate() != null ? request.getDueDate() : "") + "\"}";
        auditService.record(
                AuditActionType.CONTINUOUS_FEEDBACK_ACTION_ITEM_CREATED,
                AuditTargetType.CONTINUOUS_FEEDBACK,
                feedback.getId(),
                currentUser.getId(),
                currentUser.getRole().getId(),
                "Action item created for feedback " + feedback.getId(),
                metadata);

        notifyEmployeeOnActionItem(feedback, actionItem, currentUser);

        return toActionItemDto(actionItem);
    }

    @Transactional
    public ContinuousFeedbackActionItemDto updateActionItemStatus(Long actionItemId, ContinuousFeedbackActionItemStatusUpdateRequest request, User currentUser) {
        ContinuousFeedbackActionItem actionItem = actionItemRepository.findById(actionItemId)
                .orElseThrow(() -> new RuntimeException("Action item not found"));

        if (!isManager(currentUser)) {
            throw new RuntimeException("Only managers can update action item status");
        }

        ContinuousFeedbackActionItemStatus newStatus = parseActionItemStatus(request.getStatus());
        String beforeData = actionItem.getStatus().name();

        actionItem.setStatus(newStatus);
        if (newStatus == ContinuousFeedbackActionItemStatus.COMPLETED) {
            actionItem.setCompletedAt(Instant.now());
        } else {
            actionItem.setCompletedAt(null);
        }
        actionItem.setUpdatedAt(Instant.now());
        actionItem = actionItemRepository.save(actionItem);

        String metadata = "{\"actionItemId\":" + actionItemId
                + ",\"dueDate\":\"" + (actionItem.getDueDate() != null ? actionItem.getDueDate() : "") + "\"}";
        auditService.record(
                AuditActionType.CONTINUOUS_FEEDBACK_ACTION_ITEM_STATUS_UPDATED,
                AuditTargetType.CONTINUOUS_FEEDBACK,
                actionItem.getFeedback().getId(),
                currentUser.getId(),
                currentUser.getRole().getId(),
                "Action item " + actionItemId + " status changed to " + newStatus,
                metadata,
                beforeData,
                newStatus.name());

        return toActionItemDto(actionItem);
    }

    @Transactional
    public ContinuousFeedbackCommentDto addComment(Long feedbackId, ContinuousFeedbackCommentRequest request, User currentUser) {
        ContinuousFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Continuous feedback not found"));

        if (request.getCommentText() == null || request.getCommentText().isBlank()) {
            throw new RuntimeException("Comment text is required");
        }

        Employee author = getEmployee(currentUser);
        ContinuousFeedbackCommentType commentType;

        if (isEmployee(currentUser)) {
            if (!feedback.isShared()) {
                throw new RuntimeException("Cannot comment on feedback that has not been shared");
            }
            if (!feedback.getEmployee().getId().equals(author.getId())) {
                throw new RuntimeException("You can only comment on your own feedback");
            }
            commentType = ContinuousFeedbackCommentType.EMPLOYEE_REPLY;
        } else if (isManager(currentUser)) {
            commentType = ContinuousFeedbackCommentType.MANAGER_FOLLOW_UP;
        } else if (isHr(currentUser)) {
            commentType = ContinuousFeedbackCommentType.HR_NOTE;
        } else if (isAudit(currentUser)) {
            commentType = ContinuousFeedbackCommentType.AUDIT_NOTE;
        } else {
            throw new RuntimeException("Unauthorized to add comments");
        }

        boolean visibleToEmployee;
        if (isHr(currentUser)) {
            visibleToEmployee = request.isVisibleToEmployee();
        } else if (isAudit(currentUser)) {
            visibleToEmployee = false;
        } else if (isManager(currentUser)) {
            visibleToEmployee = true;
        } else {
            visibleToEmployee = true;
        }

        ContinuousFeedbackComment comment = new ContinuousFeedbackComment();
        comment.setFeedback(feedback);
        comment.setAuthor(author);
        comment.setCommentText(request.getCommentText());
        comment.setCommentType(commentType);
        comment.setVisibleToEmployee(visibleToEmployee);
        comment.setCreatedAt(Instant.now());
        comment = commentRepository.save(comment);

        auditService.record(
                AuditActionType.CONTINUOUS_FEEDBACK_COMMENT_ADDED,
                AuditTargetType.CONTINUOUS_FEEDBACK,
                feedback.getId(),
                currentUser.getId(),
                currentUser.getRole().getId(),
                "Comment added by " + author.getEmployeeName(),
                "{\"commentId\":" + comment.getId() + ",\"commentType\":\"" + commentType + "\"}");

        if (isEmployee(currentUser)) {
            notifyManagerOnReply(feedback, currentUser);
        }

        return toCommentDto(comment);
    }

    @Transactional(readOnly = true)
    public ContinuousFeedbackPipWarningDto getPipWarning(Long employeeId, User currentUser) {
        Instant since = Instant.now().minusSeconds(PIP_WARNING_DAYS * 86400L);
        long negativeCount = feedbackRepository.countNegativeFeedbackSince(employeeId, since);

        boolean warning = negativeCount >= PIP_WARNING_THRESHOLD;

        ContinuousFeedbackPipWarningDto dto = new ContinuousFeedbackPipWarningDto();
        dto.setWarningActive(warning);
        dto.setNegativeFeedbackCount(negativeCount);
        dto.setMessage(warning
                ? "This employee has received " + negativeCount + " improvement/performance-risk feedback records within 30 days. Consider creating a Performance Improvement Plan."
                : "No PIP warning threshold reached. Current count: " + negativeCount);

        if (warning) {
            List<ContinuousFeedback> recent = feedbackRepository.findByEmployeeIdOrderByCreatedAtDesc(employeeId);
            if (!recent.isEmpty()) {
                dto.setLatestFeedbackId(recent.get(0).getId());
            }
        }

        pipService.findOpenPipIdForEmployee(employeeId).ifPresent(dto::setActivePipId);

        return dto;
    }

    @Transactional
    public Pip createPipFromFeedback(Long feedbackId, ContinuousFeedbackCreatePipRequest request, User currentUser) {
        ContinuousFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Continuous feedback not found"));

        if (!isManager(currentUser)) {
            throw new RuntimeException("Only department heads and team heads can create PIP from feedback");
        }

        Employee employee = feedback.getEmployee();

        PipCreateRequest pipRequest = new PipCreateRequest();
        pipRequest.setEmployeeId(employee.getId());
        pipRequest.setStartDate(LocalDate.now());
        pipRequest.setEndDate(LocalDate.now().plusDays(90));
        pipRequest.setTotalHours(40);
        pipRequest.setObjectives(List.of("Improve performance in areas identified in continuous feedback"));
        pipRequest.setExpectedImprovements("Achieve performance targets as defined by manager");
        pipRequest.setReasonForPlan(request.getTriggerReason() != null ? request.getTriggerReason()
                : "Triggered by continuous feedback - " + feedback.getCategory().name());

        Pip pip = pipService.createPip(pipRequest, currentUser);

        ContinuousFeedbackPipLink link = new ContinuousFeedbackPipLink();
        link.setFeedback(feedback);
        link.setPip(pip);
        link.setCreatedAt(Instant.now());
        link.setTriggerReason(request.getTriggerReason());
        pipLinkRepository.save(link);

        feedback.setPipSuggested(true);
        feedback.setPipSuggestedAt(Instant.now());
        feedbackRepository.save(feedback);

        auditService.record(
                AuditActionType.CONTINUOUS_FEEDBACK_PIP_CREATED,
                AuditTargetType.CONTINUOUS_FEEDBACK,
                feedback.getId(),
                currentUser.getId(),
                currentUser.getRole().getId(),
                "PIP created from feedback " + feedback.getId(),
                "{\"pipId\":" + pip.getId() + ",\"employeeId\":" + employee.getId() + "}");

        return pip;
    }

    @Transactional
    public MeetingResponse createFollowUpMeeting(Long feedbackId, CreateFollowUpMeetingFromFeedbackRequest request, User currentUser) {
        ContinuousFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Continuous feedback not found"));

        if (!isManager(currentUser)) {
            throw new RuntimeException("Only managers can create follow-up meetings");
        }

        Employee manager = getManagerEmployee(currentUser);
        Instant scheduledTime = request.getScheduledTime() != null ? request.getScheduledTime() : Instant.now().plusSeconds(86400);
        int duration = request.getDurationMinutes() != null ? request.getDurationMinutes() : 30;

        MeetingRequest meetingRequest = new MeetingRequest(
                feedback.getEmployee().getId(),
                null,
                false,
                "Follow-up: Continuous Feedback",
                request.getDescription() != null ? request.getDescription()
                        : "Follow-up meeting regarding " + feedback.getCategory().name() + " feedback",
                scheduledTime,
                duration);

        MeetingResponse meeting = meetingService.scheduleMeeting(manager.getId(), meetingRequest);

        Meeting meetingEntity = meetingRepository.findById(meeting.id())
                .orElseThrow(() -> new RuntimeException("Meeting not found after creation"));

        ContinuousFeedbackMeetingLink link = new ContinuousFeedbackMeetingLink();
        link.setFeedback(feedback);
        link.setMeeting(meetingEntity);
        link.setCreatedAt(Instant.now());
        meetingLinkRepository.save(link);

        auditService.record(
                AuditActionType.CONTINUOUS_FEEDBACK_MEETING_CREATED,
                AuditTargetType.CONTINUOUS_FEEDBACK,
                feedback.getId(),
                currentUser.getId(),
                currentUser.getRole().getId(),
                "Follow-up meeting created from feedback " + feedback.getId(),
                "{\"meetingId\":" + meeting.id() + ",\"employeeId\":" + feedback.getEmployee().getId() + "}");

        return meeting;
    }

    @Transactional(readOnly = true)
    public ContinuousFeedbackDashboardDto getDashboard(User currentUser) {
        ContinuousFeedbackDashboardDto dashboard = new ContinuousFeedbackDashboardDto();

        long totalRecords;
        Map<String, Long> byCategory = new HashMap<>();
        long openItems;
        long overdueItems;
        long pipWarnings;

        if (isHr(currentUser) || isAudit(currentUser)) {
            totalRecords = feedbackRepository.count();
            List<Object[]> categoryCounts = feedbackRepository.countByCategory();
            for (Object[] row : categoryCounts) {
                String categoryKey = row[0] instanceof ContinuousFeedbackCategory category
                        ? category.name()
                        : String.valueOf(row[0]);
                long count = row[1] instanceof Number number ? number.longValue() : (Long) row[1];
                byCategory.put(categoryKey, count);
            }
            openItems = actionItemRepository.countOpenActionItems();
            overdueItems = actionItemRepository.countOverdueActionItems(LocalDate.now());
            pipWarnings = countPipWarningCases();
        } else if (isManager(currentUser)) {
            Employee manager = getManagerEmployee(currentUser);
            List<ContinuousFeedback> managerFeedback = feedbackRepository.findByManagerIdOrderByCreatedAtDesc(manager.getId());
            totalRecords = managerFeedback.size();
            for (ContinuousFeedback f : managerFeedback) {
                byCategory.merge(f.getCategory().name(), 1L, Long::sum);
            }
            openItems = actionItemRepository.findOpenByManagerId(manager.getId()).size();
            overdueItems = (int) actionItemRepository.findOpenByManagerId(manager.getId()).stream()
                    .filter(ai -> ai.getDueDate() != null && ai.getDueDate().isBefore(LocalDate.now()))
                    .count();
            pipWarnings = countPipWarningCasesForManager(manager);
        } else if (isEmployee(currentUser)) {
            Employee employee = getEmployee(currentUser);
            List<ContinuousFeedback> employeeFeedback = feedbackRepository.findSharedByEmployeeId(employee.getId());
            totalRecords = employeeFeedback.size();
            for (ContinuousFeedback f : employeeFeedback) {
                byCategory.merge(f.getCategory().name(), 1L, Long::sum);
            }
            openItems = actionItemRepository.findOpenByEmployeeId(employee.getId()).size();
            overdueItems = (int) actionItemRepository.findOpenByEmployeeId(employee.getId()).stream()
                    .filter(ai -> ai.getDueDate() != null && ai.getDueDate().isBefore(LocalDate.now()))
                    .count();
            pipWarnings = 0;
        } else {
            totalRecords = 0;
            openItems = 0;
            overdueItems = 0;
            pipWarnings = 0;
        }

        dashboard.setTotalFeedbackRecords(totalRecords);
        dashboard.setFeedbackByCategory(byCategory);
        dashboard.setOpenActionItems(openItems);
        dashboard.setOverdueActionItems(overdueItems);
        dashboard.setPipWarningCases(pipWarnings);

        return dashboard;
    }

    @Transactional(readOnly = true)
    public List<ContinuousFeedbackEvidenceDto> getEvidenceForEmployee(Long employeeId, Instant startDate, Instant endDate, User currentUser) {
        employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        if (isEmployee(currentUser)) {
            Employee self = getEmployee(currentUser);
            if (!self.getId().equals(employeeId)) {
                throw new RuntimeException("Access denied");
            }
        }

        Instant effectiveStart = startDate != null ? startDate : Instant.now().minusSeconds(365 * 86400L);
        Instant effectiveEnd = endDate != null ? endDate : Instant.now();

        List<ContinuousFeedback> evidenceList = feedbackRepository.findEvidenceByEmployeeAndDateRange(
                employeeId, effectiveStart, effectiveEnd);

        return evidenceList.stream().map(f -> {
            List<ContinuousFeedbackActionItem> actionItems = actionItemRepository.findByFeedbackIdOrderByCreatedAtDesc(f.getId());
            return ContinuousFeedbackEvidenceDto.builder()
                    .feedbackId(f.getId())
                    .category(f.getCategory().name())
                    .feedbackMessage(f.getFeedbackMessage())
                    .employeeName(f.getEmployee().getEmployeeName())
                    .employeeId(f.getEmployee().getId())
                    .managerName(f.getManager().getEmployeeName())
                    .createdAt(f.getCreatedAt())
                    .acknowledged(f.isAcknowledged())
                    .acknowledgedAt(f.getAcknowledgedAt())
                    .actionItems(actionItems.stream().map(this::toActionItemDto).collect(Collectors.toList()))
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ContinuousFeedbackDto> getHistoryByDateRange(
            Instant startDate, Instant endDate, Long employeeId, String category, User currentUser) {
        Instant effectiveStart = startDate != null ? startDate : Instant.now().minusSeconds(365 * 86400L);
        Instant effectiveEnd = endDate != null ? endDate : Instant.now();

        List<ContinuousFeedback> results;

        if (isHr(currentUser) || isAudit(currentUser)) {
            results = feedbackRepository.findHistoryByDateRange(effectiveStart, effectiveEnd, employeeId, category);
        } else if (isManager(currentUser)) {
            Employee manager = getManagerEmployee(currentUser);
            if (employeeId != null) {
                results = feedbackRepository.findHistoryByDateRange(effectiveStart, effectiveEnd, employeeId, category);
                results = results.stream()
                        .filter(f -> f.getManager().getId().equals(manager.getId()))
                        .collect(Collectors.toList());
            } else {
                results = feedbackRepository.findHistoryByManagerAndDateRange(manager.getId(), effectiveStart, effectiveEnd, category);
            }
        } else {
            throw new RuntimeException("Access denied");
        }

        return results.stream()
                .map(f -> toDto(f, currentUser))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ContinuousFeedbackDto> getScheduledFeedback(User currentUser) {
        if (isHr(currentUser) || isAudit(currentUser)) {
            return feedbackRepository.findAllScheduled().stream()
                    .map(f -> toDto(f, currentUser))
                    .collect(Collectors.toList());
        } else if (isManager(currentUser)) {
            Employee manager = getManagerEmployee(currentUser);
            return feedbackRepository.findScheduledByManagerId(manager.getId()).stream()
                    .map(f -> toDto(f, currentUser))
                    .collect(Collectors.toList());
        }
        throw new RuntimeException("Access denied");
    }

    private void checkPipWarning(ContinuousFeedback feedback, User currentUser) {
        if (!NEGATIVE_CATEGORIES.contains(feedback.getCategory().name())) {
            return;
        }

        Long employeeId = feedback.getEmployee().getId();
        Instant since = Instant.now().minusSeconds(PIP_WARNING_DAYS * 86400L);
        long negativeCount = feedbackRepository.countNegativeFeedbackSince(employeeId, since);

        if (negativeCount >= PIP_WARNING_THRESHOLD) {
            List<ContinuousFeedback> recentFeedbacks = feedbackRepository
                    .findByEmployeeIdOrderByCreatedAtDesc(employeeId);

            for (ContinuousFeedback f : recentFeedbacks) {
                if (!f.isPipSuggested()) {
                    f.setPipSuggested(true);
                    f.setPipSuggestedAt(Instant.now());
                    feedbackRepository.save(f);

                    auditService.record(
                            AuditActionType.CONTINUOUS_FEEDBACK_PIP_WARNING_TRIGGERED,
                            AuditTargetType.CONTINUOUS_FEEDBACK,
                            f.getId(),
                            currentUser.getId(),
                            currentUser.getRole().getId(),
                            "PIP warning triggered: " + negativeCount + " negative feedback records in 30 days for employee "
                                    + feedback.getEmployee().getEmployeeName(),
                            "{\"employeeId\":" + employeeId + ",\"negativeCount\":" + negativeCount + "}");
                }
            }

            notifyPipWarning(feedback.getEmployee().getUserAccount(), currentUser);
            notifyPipWarning(feedback.getManager().getUserAccount(), currentUser);
        }
    }

    private long countPipWarningCases() {
        Instant since = Instant.now().minusSeconds(PIP_WARNING_DAYS * 86400L);
        List<ContinuousFeedback> allFeedback = feedbackRepository.findAll();
        Map<Long, Long> employeeNegativeCount = new HashMap<>();

        for (ContinuousFeedback f : allFeedback) {
            if (NEGATIVE_CATEGORIES.contains(f.getCategory().name()) && f.getCreatedAt().isAfter(since)) {
                employeeNegativeCount.merge(f.getEmployee().getId(), 1L, Long::sum);
            }
        }

        return employeeNegativeCount.values().stream().filter(c -> c >= PIP_WARNING_THRESHOLD).count();
    }

    private long countPipWarningCasesForManager(Employee manager) {
        Instant since = Instant.now().minusSeconds(PIP_WARNING_DAYS * 86400L);
        List<ContinuousFeedback> managerFeedback = feedbackRepository.findByManagerIdOrderByCreatedAtDesc(manager.getId());
        Map<Long, Long> employeeNegativeCount = new HashMap<>();

        for (ContinuousFeedback f : managerFeedback) {
            if (NEGATIVE_CATEGORIES.contains(f.getCategory().name()) && f.getCreatedAt().isAfter(since)) {
                employeeNegativeCount.merge(f.getEmployee().getId(), 1L, Long::sum);
            }
        }

        return employeeNegativeCount.values().stream().filter(c -> c >= PIP_WARNING_THRESHOLD).count();
    }

    private void validateManager(User user) {
        if (user.getRole() == null) {
            throw new RuntimeException("Only managers can create continuous feedback");
        }
        Long roleId = user.getRole().getId();
        if (!MANAGER_ROLE_ID.equals(roleId) && !TEAM_HEAD_ROLE_ID.equals(roleId) && !HR_ROLE_ID.equals(roleId)) {
            throw new RuntimeException("Only managers can create continuous feedback");
        }
    }

    private void validateFeedbackManager(ContinuousFeedback feedback, User user) {
        if (user.getEmployee() == null) {
            throw new RuntimeException("User does not have an associated employee record");
        }
        if (user.getRole() != null && (HR_ROLE_ID.equals(user.getRole().getId()) || AUDIT_ROLE_ID.equals(user.getRole().getId()))) {
            return;
        }
        Employee manager = getManagerEmployee(user);
        if (!feedback.getManager().getId().equals(manager.getId())) {
            throw new RuntimeException("You can only modify your own feedback");
        }
    }

    private void validateManagerEmployeeRelationship(Employee manager, Employee employee) {
        Optional<EmployeeReportingHistory> currentReporting = reportingHistoryRepository
                .findByEmployee_IdAndCurrentTrue(employee.getId());

        if (currentReporting.isPresent()) {
            if (!currentReporting.get().getManager().getId().equals(manager.getId())) {
                throw new RuntimeException("You can only create feedback for your direct reports");
            }
        } else {
            if (employee.getManager() == null || !employee.getManager().getId().equals(manager.getId())) {
                throw new RuntimeException("You can only create feedback for your direct reports");
            }
        }
    }

    private void validateAccess(ContinuousFeedback feedback, User user) {
        if (isEmployee(user)) {
            Employee employee = getEmployee(user);
            if (!feedback.getEmployee().getId().equals(employee.getId())) {
                throw new RuntimeException("Access denied");
            }
            if (!feedback.isShared()) {
                throw new RuntimeException("Access denied");
            }
        }
    }

    private void notifyEmployeeOnShare(ContinuousFeedback feedback) {
        User recipient = feedback.getEmployee().getUserAccount();
        if (recipient != null) {
            notificationService.send(
                    recipient,
                    "New Continuous Feedback",
                    "You have received new " + feedback.getCategory().name() + " feedback from "
                            + feedback.getManager().getEmployeeName(),
                    "CONTINUOUS_FEEDBACK",
                    feedback.getId());
        }
    }

    private void notifyEmployeeOnActionItem(ContinuousFeedback feedback, ContinuousFeedbackActionItem actionItem, User currentUser) {
        User recipient = feedback.getEmployee().getUserAccount();
        if (recipient != null) {
            notificationService.send(
                    recipient,
                    "New Action Item",
                    "A new action item has been assigned to you: " + actionItem.getDescription(),
                    "CONTINUOUS_FEEDBACK",
                    feedback.getId());
        }
    }

    private void notifyManagerOnAcknowledge(ContinuousFeedback feedback, User currentUser) {
        User recipient = feedback.getManager().getUserAccount();
        if (recipient != null) {
            notificationService.send(
                    recipient,
                    "Feedback Acknowledged",
                    feedback.getEmployee().getEmployeeName() + " has acknowledged your feedback",
                    "CONTINUOUS_FEEDBACK",
                    feedback.getId());
        }
    }

    private void notifyManagerOnReply(ContinuousFeedback feedback, User currentUser) {
        User recipient = feedback.getManager().getUserAccount();
        if (recipient != null) {
            notificationService.send(
                    recipient,
                    "New Reply on Feedback",
                    feedback.getEmployee().getEmployeeName() + " replied to your feedback",
                    "CONTINUOUS_FEEDBACK",
                    feedback.getId());
        }
    }

    private void notifyPipWarning(User recipient, User currentUser) {
        if (recipient != null) {
            notificationService.send(
                    recipient,
                    "PIP Warning",
                    "An employee has received multiple improvement/performance-risk feedback records. Consider creating a PIP.",
                    "CONTINUOUS_FEEDBACK");
        }
    }

    private ContinuousFeedbackDto toDto(ContinuousFeedback feedback, User currentUser) {
        boolean canSeePrivateNote = isManager(currentUser) || isHr(currentUser) || isAudit(currentUser);

        if (currentUser.getEmployee() != null && feedback.getManager() != null) {
            if (currentUser.getEmployee().getId().equals(feedback.getManager().getId())) {
                canSeePrivateNote = true;
            }
        }

        return ContinuousFeedbackDto.builder()
                .feedbackId(feedback.getId())
                .employeeId(feedback.getEmployee().getId())
                .employeeName(feedback.getEmployee().getEmployeeName())
                .employeeBusinessId(feedback.getEmployee().getEmployeeId())
                .managerId(feedback.getManager().getId())
                .managerName(feedback.getManager().getEmployeeName())
                .category(feedback.getCategory().name())
                .feedbackMessage(feedback.getFeedbackMessage())
                .privateManagerNote(canSeePrivateNote ? feedback.getPrivateManagerNote() : null)
                .visibilityStatus(feedback.getVisibilityStatus().name())
                .scheduledPublishAt(feedback.getScheduledPublishAt())
                .scheduledByUserId(feedback.getScheduledBy() != null ? feedback.getScheduledBy().getId() : null)
                .cancelledAt(feedback.getCancelledAt())
                .cancelledByUserId(feedback.getCancelledBy() != null ? feedback.getCancelledBy().getId() : null)
                .shared(feedback.isShared())
                .sharedAt(feedback.getSharedAt())
                .acknowledged(feedback.isAcknowledged())
                .acknowledgedAt(feedback.getAcknowledgedAt())
                .supportingEvidence(feedback.isSupportingEvidence())
                .pipSuggested(feedback.isPipSuggested())
                .pipSuggestedAt(feedback.getPipSuggestedAt())
                .createdAt(feedback.getCreatedAt())
                .updatedAt(feedback.getUpdatedAt())
                .createdByUserId(feedback.getCreatedBy() != null ? feedback.getCreatedBy().getId() : null)
                .updatedByUserId(feedback.getUpdatedBy() != null ? feedback.getUpdatedBy().getId() : null)
                .build();
    }

    private ContinuousFeedbackActionItemDto toActionItemDto(ContinuousFeedbackActionItem actionItem) {
        return ContinuousFeedbackActionItemDto.builder()
                .actionItemId(actionItem.getId())
                .feedbackId(actionItem.getFeedback().getId())
                .description(actionItem.getDescription())
                .dueDate(actionItem.getDueDate())
                .status(actionItem.getStatus().name())
                .completedAt(actionItem.getCompletedAt())
                .createdAt(actionItem.getCreatedAt())
                .updatedAt(actionItem.getUpdatedAt())
                .build();
    }

    private ContinuousFeedbackCommentDto toCommentDto(ContinuousFeedbackComment comment) {
        return ContinuousFeedbackCommentDto.builder()
                .commentId(comment.getId())
                .feedbackId(comment.getFeedback().getId())
                .authorEmployeeId(comment.getAuthor().getId())
                .authorEmployeeName(comment.getAuthor().getEmployeeName())
                .commentText(comment.getCommentText())
                .commentType(comment.getCommentType().name())
                .visibleToEmployee(comment.isVisibleToEmployee())
                .createdAt(comment.getCreatedAt())
                .build();
    }

    private String createMetadata(ContinuousFeedback feedback) {
        return "{\"employeeId\":" + feedback.getEmployee().getId()
                + ",\"managerId\":" + feedback.getManager().getId()
                + ",\"category\":\"" + feedback.getCategory() + "\""
                + ",\"visibilityStatus\":\"" + feedback.getVisibilityStatus() + "\"}";
    }

    private ContinuousFeedbackCategory parseCategory(String category) {
        try {
            return ContinuousFeedbackCategory.valueOf(category.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid category: " + category);
        }
    }

    private ContinuousFeedbackActionItemStatus parseActionItemStatus(String status) {
        try {
            return ContinuousFeedbackActionItemStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid action item status: " + status);
        }
    }

    private Employee getManagerEmployee(User user) {
        if (user.getEmployee() == null) {
            throw new RuntimeException("User does not have an associated employee record");
        }
        return user.getEmployee();
    }

    private Employee getEmployee(User user) {
        if (user.getEmployee() == null) {
            throw new RuntimeException("User does not have an associated employee record");
        }
        return user.getEmployee();
    }

    private boolean isManager(User user) {
        return user.getRole() != null && (MANAGER_ROLE_ID.equals(user.getRole().getId()) || TEAM_HEAD_ROLE_ID.equals(user.getRole().getId()));
    }

    private boolean isEmployee(User user) {
        return user.getRole() != null && !MANAGER_ROLE_ID.equals(user.getRole().getId())
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
