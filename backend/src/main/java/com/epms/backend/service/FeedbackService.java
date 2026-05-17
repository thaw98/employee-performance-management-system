package com.epms.backend.service;

import com.epms.backend.StaffTypes;
import com.epms.backend.dto.FeedbackHistoryDto;
import com.epms.backend.dto.FeedbackSubmissionRequest;
import com.epms.backend.entity.*;
import com.epms.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final EmployeeRepository employeeRepository;
    private final ReportingManagerResolver reportingManagerResolver;
    private final CriteriaRepository criteriaRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final TimeSettingService timeSettingService;

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
        feedback.setCreatedDate(Instant.now());

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

        userRepository.findByEmployee_Id(evaluatee.getId())
                .ifPresent(recipient -> notificationService.send(
                        recipient,
                        "Feedback received",
                        "You have received feedback",
                        "360_FEEDBACK"));
    }

    @Transactional(readOnly = true)
    public Page<FeedbackHistoryDto> getFeedbackHistory(Long evaluatorId, Pageable pageable) {
        Page<Feedback> feedbackPage = feedbackRepository.findByEvaluatorId(evaluatorId, pageable);
        return feedbackPage.map(this::mapToHistoryDto);
    }

    @Transactional(readOnly = true)
    public Page<FeedbackHistoryDto> getReceivedFeedback(Long evaluateeId, Pageable pageable) {
        Page<Feedback> feedbackPage = feedbackRepository.findByEvaluateeId(evaluateeId, pageable);
        return feedbackPage.map(this::mapToReceivedHistoryDto);
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
        return dto;
    }

    private FeedbackHistoryDto mapToReceivedHistoryDto(Feedback entity) {
        FeedbackHistoryDto dto = mapToHistoryDto(entity);
        Employee evaluatee = entity.getEvaluatee();
        Employee manager = reportingManagerResolver.resolve(evaluatee);
        boolean directManagerFeedback = manager != null
                && entity.getEvaluator() != null
                && manager.getId().equals(entity.getEvaluator().getId());

        dto.setEvaluatorName(directManagerFeedback ? entity.getEvaluator().getEmployeeName() : "Anonymous");
        return dto;
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
        Instant cycleEnd = cycle.getEndDate().plusDays(1).atStartOfDay(ZoneId.systemDefault()).minusNanos(1).toInstant();
        return feedbackRepository.existsByEvaluatorIdAndEvaluateeIdAndCreatedDateBetween(evaluatorId, evaluateeId, cycleStart, cycleEnd);
    }

    private boolean isProbationEmployee(Employee employee) {
        return employee != null
                && employee.getStaffType() != null
                && employee.getStaffType().getId() == StaffTypes.PROBATION;
    }

}
