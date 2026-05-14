package com.epms.backend.service;

import com.epms.backend.StaffTypes;
import com.epms.backend.dto.FeedbackDraftDto;
import com.epms.backend.dto.FeedbackHistoryFilter;
import com.epms.backend.dto.FeedbackHistoryDto;
import com.epms.backend.dto.FeedbackSubmissionRequest;
import com.epms.backend.entity.*;
import com.epms.backend.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final FeedbackDraftRepository feedbackDraftRepository;
    private final EmployeeRepository employeeRepository;
    @SuppressWarnings("unused")
    private final ReportingManagerResolver reportingManagerResolver;
    private final CriteriaRepository criteriaRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final TimeSettingService timeSettingService;
    private final ReviewCycleService reviewCycleService;
    private final ReviewCycleRepository reviewCycleRepository;

    public FeedbackService(
            FeedbackRepository feedbackRepository,
            FeedbackDraftRepository feedbackDraftRepository,
            EmployeeRepository employeeRepository,
            ReportingManagerResolver reportingManagerResolver,
            CriteriaRepository criteriaRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            TimeSettingService timeSettingService,
            ReviewCycleService reviewCycleService,
            ReviewCycleRepository reviewCycleRepository) {
        this.feedbackRepository = feedbackRepository;
        this.feedbackDraftRepository = feedbackDraftRepository;
        this.employeeRepository = employeeRepository;
        this.reportingManagerResolver = reportingManagerResolver;
        this.criteriaRepository = criteriaRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.timeSettingService = timeSettingService;
        this.reviewCycleService = reviewCycleService;
        this.reviewCycleRepository = reviewCycleRepository;
    }

    @Transactional
    public void submitFeedback(Long evaluatorId, FeedbackSubmissionRequest request) {
        Employee evaluator = employeeRepository.findById(evaluatorId)
                .orElseThrow(() -> new RuntimeException("Evaluator not found"));
        Employee evaluatee = employeeRepository.findById(request.getEvaluateeId())
                .orElseThrow(() -> new RuntimeException("Evaluatee not found"));
        if (isProbationEmployee(evaluatee)) {
            throw new RuntimeException("Probation employees cannot receive 360 feedback");
        }

        if (!evaluator.getDepartment().getId().equals(evaluatee.getDepartment().getId())) {
            throw new RuntimeException("Evaluator and Evaluatee must be in the same department");
        }

        com.epms.backend.dto.TimeSettingDto cycle = timeSettingService.getCurrentCycleRange();
        Instant cycleStart = cycle.getStartDate().atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant cycleEnd = cycle.getEndDate().plusDays(1).atStartOfDay(ZoneId.systemDefault()).minusNanos(1)
                .toInstant();

        long currentRoleCount = feedbackRepository.countByEvaluatorIdAndRoleAndCreatedDateBetween(evaluatorId,
                request.getRole(), cycleStart, cycleEnd);
        if (currentRoleCount >= 5) {
            throw new RuntimeException("Maximum of 5 feedbacks allowed per role in the active cycle");
        }

        if (feedbackRepository.existsByEvaluatorIdAndEvaluateeIdAndCreatedDateBetween(evaluatorId,
                request.getEvaluateeId(), cycleStart, cycleEnd)) {
            throw new RuntimeException("Feedback already given for this employee in the current cycle");
        }

        Feedback feedback = new Feedback();
        feedback.setEvaluator(evaluator);
        feedback.setEvaluatee(evaluatee);
        feedback.setRole(request.getRole());
        feedback.setAnonymous(Boolean.TRUE.equals(request.getAnonymous()));
        feedback.setCreatedDate(Instant.now());
        ReviewCycle activeCycle = reviewCycleService.getActiveSubmissionCycle();
        feedback.setReviewCycle(activeCycle);

        List<FeedbackDetail> details = new ArrayList<>();
        int totalPoints = 0;
        int questionCount = request.getDetails().size();

        for (FeedbackSubmissionRequest.FeedbackDetailRequest reqDetail : request.getDetails()) {
            Criteria criteria = criteriaRepository.findById(reqDetail.getCriteriaId())
                    .orElseThrow(() -> new RuntimeException("Criteria not found"));

            FeedbackDetail detail = new FeedbackDetail();
            detail.setFeedback(feedback);
            detail.setCriteria(criteria);
            detail.setRating(reqDetail.getRating());
            detail.setComment(reqDetail.getComment());
            details.add(detail);

            totalPoints += reqDetail.getRating();
        }

        double score = (totalPoints * 100.0) / (questionCount * 5.0);
        feedback.setScore(score);
        feedback.setRemark(calculateRemark(score));
        feedback.setDetails(details);

        feedbackRepository.save(feedback);

        if (activeCycle != null) {
            feedbackDraftRepository.deleteByEvaluatorIdAndEvaluateeIdAndRoleAndReviewCycleId(
                    evaluatorId,
                    request.getEvaluateeId(),
                    request.getRole(),
                    activeCycle.getId());
        }

        userRepository.findByEmployee_Id(evaluatee.getId())
                .ifPresent(recipient -> notificationService.send(
                        recipient,
                        "Feedback received",
                        "You have received feedback",
                        "360_FEEDBACK"));
    }

    @Transactional(readOnly = true)
    public Page<FeedbackHistoryDto> getFeedbackHistory(Long evaluatorId, FeedbackHistoryFilter filter, Pageable pageable) {
        Page<Feedback> feedbackPage = feedbackRepository.findAll(historySpec(evaluatorId, filter), pageable);
        return feedbackPage.map(this::mapToHistoryDto);
    }

    @Transactional(readOnly = true)
    public Page<FeedbackHistoryDto> getFeedbackHistory(Long evaluatorId, Pageable pageable) {
        return getFeedbackHistory(evaluatorId, new FeedbackHistoryFilter(), pageable);
    }

    @Transactional(readOnly = true)
    public Page<FeedbackHistoryDto> getReceivedFeedback(Long evaluateeId, Pageable pageable) {
        Page<Feedback> feedbackPage = feedbackRepository.findByEvaluateeId(evaluateeId, pageable);
        return feedbackPage.map(this::mapToReceivedHistoryDto);
    }

    @Transactional
    public FeedbackDraftDto saveDraft(Long evaluatorId, FeedbackSubmissionRequest request) {
        cleanupExpiredDrafts();
        Employee evaluator = employeeRepository.findById(evaluatorId)
                .orElseThrow(() -> new RuntimeException("Evaluator not found"));
        Employee evaluatee = employeeRepository.findById(request.getEvaluateeId())
                .orElseThrow(() -> new RuntimeException("Evaluatee not found"));
        if (isProbationEmployee(evaluatee)) {
            throw new RuntimeException("Probation employees cannot receive 360 feedback");
        }
        if (!evaluator.getDepartment().getId().equals(evaluatee.getDepartment().getId())) {
            throw new RuntimeException("Evaluator and Evaluatee must be in the same department");
        }

        ReviewCycle cycle = reviewCycleService.getActiveSubmissionCycle();
        if (cycle == null) {
            throw new RuntimeException("No active review cycle found for feedback drafts");
        }

        FeedbackDraft draft = feedbackDraftRepository
                .findByEvaluatorIdAndEvaluateeIdAndRoleAndReviewCycleId(evaluatorId, evaluatee.getId(), request.getRole(), cycle.getId())
                .orElseGet(FeedbackDraft::new);
        draft.setEvaluator(evaluator);
        draft.setEvaluatee(evaluatee);
        draft.setReviewCycle(cycle);
        draft.setRole(request.getRole());
        draft.setAnonymous(Boolean.TRUE.equals(request.getAnonymous()));
        draft.getDetails().clear();

        if (request.getDetails() != null) {
            for (FeedbackSubmissionRequest.FeedbackDetailRequest reqDetail : request.getDetails()) {
                Criteria criteria = criteriaRepository.findById(reqDetail.getCriteriaId())
                        .orElseThrow(() -> new RuntimeException("Criteria not found"));
                FeedbackDraftDetail detail = new FeedbackDraftDetail();
                detail.setDraft(draft);
                detail.setCriteria(criteria);
                detail.setRating(reqDetail.getRating());
                detail.setComment(reqDetail.getComment());
                draft.getDetails().add(detail);
            }
        }

        return mapToDraftDto(feedbackDraftRepository.save(draft));
    }

    @Transactional(readOnly = true)
    public FeedbackDraftDto getDraft(Long evaluatorId, Long evaluateeId, String role) {
        ReviewCycle cycle = reviewCycleService.getActiveSubmissionCycle();
        if (cycle == null) {
            return null;
        }
        return feedbackDraftRepository
                .findByEvaluatorIdAndEvaluateeIdAndRoleAndReviewCycleId(evaluatorId, evaluateeId, role, cycle.getId())
                .map(this::mapToDraftDto)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<FeedbackDraftDto> getDrafts(Long evaluatorId) {
        ReviewCycle cycle = reviewCycleService.getActiveSubmissionCycle();
        if (cycle == null) {
            return List.of();
        }
        return feedbackDraftRepository.findByEvaluatorIdAndReviewCycleIdOrderByUpdatedAtDesc(evaluatorId, cycle.getId())
                .stream()
                .map(this::mapToDraftDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteDraft(Long evaluatorId, Long draftId) {
        FeedbackDraft draft = feedbackDraftRepository.findByIdAndEvaluatorId(draftId, evaluatorId)
                .orElseThrow(() -> new RuntimeException("Draft not found"));
        feedbackDraftRepository.delete(draft);
    }

    @Scheduled(cron = "0 15 0 * * *")
    @Transactional
    public void cleanupExpiredDrafts() {
        feedbackDraftRepository.deleteByReviewCycle_EndDateBefore(LocalDate.now());
    }

    private String calculateRemark(double score) {
        if (score >= 86)
            return "Outstanding";
        if (score >= 71)
            return "Good";
        if (score >= 60)
            return "Meet Requirement";
        if (score >= 40)
            return "Need Improvement";
        return "Unsatisfactory";
    }

    private FeedbackHistoryDto mapToHistoryDto(Feedback entity) {
        FeedbackHistoryDto dto = new FeedbackHistoryDto();
        dto.setId(entity.getId());
        dto.setDate(entity.getCreatedDate());
        dto.setEvaluatorName(entity.getEvaluator().getEmployeeName());
        dto.setEvaluateeName(entity.getEvaluatee().getEmployeeName());
        dto.setEvaluateeStaffNo(entity.getEvaluatee().getEmployeeId());
        dto.setPosition(entity.getEvaluatee().getPosition().getName());
        dto.setRole(entity.getRole());
        dto.setScore(entity.getScore());
        dto.setRemark(entity.getRemark());
        dto.setAnonymous(Boolean.TRUE.equals(entity.getAnonymous()));
        dto.setStatus("SUBMITTED");
        if (entity.getReviewCycle() != null) {
            dto.setReviewCycleId(entity.getReviewCycle().getId());
            dto.setReviewCycleName(entity.getReviewCycle().getName());
        } else {
            ReviewCycle cycle = resolveCycleForDate(entity.getCreatedDate());
            if (cycle != null) {
                dto.setReviewCycleId(cycle.getId());
                dto.setReviewCycleName(cycle.getName());
            }
        }
        return dto;
    }

    private FeedbackHistoryDto mapToReceivedHistoryDto(Feedback entity) {
        FeedbackHistoryDto dto = mapToHistoryDto(entity);

        if (Boolean.TRUE.equals(entity.getAnonymous())) {
            dto.setEvaluatorName("Anonymous");
        } else {
            dto.setEvaluatorName(entity.getEvaluator().getEmployeeName());
        }

        // Invert the role for the recipient's view
        dto.setRole(getEvaluatorRoleRelation(entity.getRole()).toUpperCase());

        return dto;
    }

    private String getEvaluatorRoleRelation(String evaluateeRoleRelation) {
        if ("SUBORDINATE".equalsIgnoreCase(evaluateeRoleRelation))
            return "Manager";
        if ("MANAGER".equalsIgnoreCase(evaluateeRoleRelation))
            return "Subordinate";
        if ("PEER".equalsIgnoreCase(evaluateeRoleRelation))
            return "Peer";
        return "Anonymous";
    }

    public List<com.epms.backend.dto.FeedbackDetailDto> getFeedbackDetails(Long feedbackId) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Feedback not found"));

        return feedback.getDetails().stream().map(d -> {
            com.epms.backend.dto.FeedbackDetailDto dto = new com.epms.backend.dto.FeedbackDetailDto();
            dto.setCriteriaName(d.getCriteria().getName());
            dto.setRating(d.getRating());
            dto.setComment(d.getComment());
            return dto;
        }).collect(Collectors.toList());
    }

    public List<Employee> getEligibleEvaluatees(Long evaluatorId, String role) {
        Employee evaluator = employeeRepository.findById(evaluatorId)
                .orElseThrow(() -> new RuntimeException("Evaluator not found"));

        if (evaluator.getDepartment() == null || evaluator.getPosition() == null
                || evaluator.getPosition().getLevelCode() == null) {
            return new ArrayList<>();
        }

        Long deptId = evaluator.getDepartment().getId();
        Long levelId = evaluator.getPosition().getLevelCode().getId();

        List<Employee> colleagues = employeeRepository.findByDepartmentId(deptId);

        return colleagues.stream()
                .filter(e -> !e.getId().equals(evaluatorId)) // Exclude self
                .filter(e -> !isProbationEmployee(e))
                .filter(e -> e.getPosition() != null && e.getPosition().getLevelCode() != null)
                .filter(e -> {
                    Long eLevelId = e.getPosition().getLevelCode().getId();
                    switch (role) {
                        case "PEER":
                            return eLevelId.equals(levelId);
                        case "SUBORDINATE":
                            return eLevelId > levelId;
                        case "MANAGER":
                            return eLevelId < levelId;
                        default:
                            return false;
                    }
                })
                .collect(Collectors.toList());
    }

    public long countFeedbacksByRoleInCycle(Long evaluatorId, String role, Instant start, Instant end) {
        return feedbackRepository.countByEvaluatorIdAndRoleAndCreatedDateBetween(evaluatorId, role, start, end);
    }

    public boolean isFeedbackGivenInCurrentCycle(Long evaluatorId, Long evaluateeId) {
        com.epms.backend.dto.TimeSettingDto cycle = timeSettingService.getCurrentCycleRange();
        Instant cycleStart = cycle.getStartDate().atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant cycleEnd = cycle.getEndDate().plusDays(1).atStartOfDay(ZoneId.systemDefault()).minusNanos(1)
                .toInstant();
        return feedbackRepository.existsByEvaluatorIdAndEvaluateeIdAndCreatedDateBetween(evaluatorId, evaluateeId,
                cycleStart, cycleEnd);
    }

    private boolean isProbationEmployee(Employee employee) {
        return employee != null
                && employee.getStaffType() != null
                && employee.getStaffType().getId() == StaffTypes.PROBATION;
    }

    private FeedbackDraftDto mapToDraftDto(FeedbackDraft draft) {
        FeedbackDraftDto dto = new FeedbackDraftDto();
        dto.setId(draft.getId());
        dto.setEvaluateeId(draft.getEvaluatee().getId());
        dto.setEvaluateeName(draft.getEvaluatee().getEmployeeName());
        dto.setEvaluateeStaffNo(draft.getEvaluatee().getEmployeeId());
        dto.setEvaluateePosition(draft.getEvaluatee().getPosition() != null ? draft.getEvaluatee().getPosition().getName() : "N/A");
        dto.setEvaluateeDepartment(draft.getEvaluatee().getDepartment() != null ? draft.getEvaluatee().getDepartment().getName() : "N/A");
        dto.setRole(draft.getRole());
        dto.setAnonymous(Boolean.TRUE.equals(draft.getAnonymous()));
        dto.setReviewCycleId(draft.getReviewCycle().getId());
        dto.setReviewCycleName(draft.getReviewCycle().getName());
        dto.setUpdatedAt(draft.getUpdatedAt());
        dto.setDetails(draft.getDetails().stream().map(d -> {
            FeedbackSubmissionRequest.FeedbackDetailRequest detail = new FeedbackSubmissionRequest.FeedbackDetailRequest();
            detail.setCriteriaId(d.getCriteria().getId());
            detail.setRating(d.getRating());
            detail.setComment(d.getComment());
            return detail;
        }).collect(Collectors.toList()));
        return dto;
    }

    private Specification<Feedback> historySpec(Long evaluatorId, FeedbackHistoryFilter filter) {
        ReviewCycle filterCycle = filter != null && filter.getReviewCycleId() != null
                ? reviewCycleRepository.findById(filter.getReviewCycleId()).orElse(null)
                : null;
        return (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("evaluator").get("id"), evaluatorId));

            if (filter != null) {
                if (filter.getReviewCycleId() != null) {
                    if (filterCycle == null) {
                        predicates.add(cb.disjunction());
                    } else {
                        Instant cycleStart = filterCycle.getStartDate().atStartOfDay(ZoneId.systemDefault()).toInstant();
                        Instant cycleEnd = filterCycle.getEndDate().plusDays(1).atStartOfDay(ZoneId.systemDefault()).minusNanos(1).toInstant();
                        predicates.add(cb.or(
                                cb.equal(root.get("reviewCycle").get("id"), filter.getReviewCycleId()),
                                cb.and(
                                        cb.isNull(root.get("reviewCycle")),
                                        cb.between(root.get("createdDate"), cycleStart, cycleEnd))));
                    }
                }
                if (filter.getStatus() != null && !filter.getStatus().isBlank()
                        && !"SUBMITTED".equalsIgnoreCase(filter.getStatus())) {
                    predicates.add(cb.disjunction());
                }
                if (filter.getFromDate() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(
                            root.get("createdDate"),
                            filter.getFromDate().atStartOfDay(ZoneId.systemDefault()).toInstant()));
                }
                if (filter.getToDate() != null) {
                    predicates.add(cb.lessThanOrEqualTo(
                            root.get("createdDate"),
                            filter.getToDate().plusDays(1).atStartOfDay(ZoneId.systemDefault()).minusNanos(1).toInstant()));
                }
                if (hasText(filter.getReviewer())) {
                    String value = like(filter.getReviewer());
                    predicates.add(cb.like(cb.lower(root.get("evaluator").get("employeeName")), value));
                }
                if (hasText(filter.getReviewee())) {
                    String value = like(filter.getReviewee());
                    predicates.add(cb.or(
                            cb.like(cb.lower(root.get("evaluatee").get("employeeName")), value),
                            cb.like(cb.lower(root.get("evaluatee").get("employeeId")), value)));
                }
                if (hasText(filter.getFeedbackType())) {
                    predicates.add(cb.equal(cb.upper(root.get("role")), filter.getFeedbackType().toUpperCase(Locale.ROOT)));
                }
            }

            query.orderBy(cb.desc(root.get("createdDate")));
            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }

    private ReviewCycle resolveCycleForDate(Instant createdDate) {
        if (createdDate == null) {
            return null;
        }
        LocalDate date = createdDate.atZone(ZoneId.systemDefault()).toLocalDate();
        return reviewCycleRepository
                .findByStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByRequiresEmployeeSubmissionDescStartDateDesc(date, date)
                .stream()
                .filter(ReviewCycle::isRequiresEmployeeSubmission)
                .findFirst()
                .orElse(null);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String like(String value) {
        return "%" + value.trim().toLowerCase(Locale.ROOT) + "%";
    }

}
