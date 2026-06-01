package com.epms.backend.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.dto.PerformanceReportSummaryDto;
import com.epms.backend.entity.AppraisalAssignment;
import com.epms.backend.entity.AppraisalStatus;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.EmployeeKpi;
import com.epms.backend.entity.EmployeeStatus;
import com.epms.backend.entity.Feedback;
import com.epms.backend.entity.Pip;
import com.epms.backend.entity.PromotionProposal;
import com.epms.backend.entity.SelfAssessmentForm;
import com.epms.backend.entity.SelfAssessmentFormStatus;
import com.epms.backend.repository.AppraisalAssignmentRepository;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.FeedbackRepository;
import com.epms.backend.repository.KpiRepository;
import com.epms.backend.repository.PipRepository;
import com.epms.backend.repository.PromotionProposalRepository;
import com.epms.backend.repository.SelfAssessmentFormRepository;
import com.epms.backend.entity.PromotionProposalStatus;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class PerformanceReportService {

    private final EmployeeRepository employeeRepository;
    private final KpiRepository kpiRepository;
    private final AppraisalAssignmentRepository appraisalRepository;
    private final SelfAssessmentFormRepository selfAssessmentRepository;
    private final FeedbackRepository feedbackRepository;
    private final PipRepository pipRepository;
    private final PromotionProposalRepository promotionProposalRepository;
    private final ProfilePictureStorageService profilePictureStorageService;

    private static final List<String> ACTIVE_PIP_STATUSES = List.of("ACTIVE", "REOPEN_REQUESTED");

    @Transactional(readOnly = true)
    public List<PerformanceReportSummaryDto> getAllEmployeeReportSummaries() {
        List<Employee> employees = employeeRepository.findAll().stream()
                .filter(e -> e.getEmploymentStatus() == EmployeeStatus.ACTIVE)
                .toList();

        List<PerformanceReportSummaryDto> results = new ArrayList<>();
        for (Employee emp : employees) {
            try {
                results.add(buildSummary(emp));
            } catch (Exception e) {
                log.warn("Failed to build performance summary for employee {}: {}", emp.getId(), e.getMessage());
            }
        }
        return results;
    }

    @Transactional(readOnly = true)
    public PerformanceReportSummaryDto getEmployeeReportSummary(Long employeeId) {
        Employee emp = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + employeeId));
        return buildSummary(emp);
    }

    private PerformanceReportSummaryDto buildSummary(Employee emp) {
        // 1. KPI Score
        KpiResult kpiResult = calculateKpiScore(emp.getId());

        // 2. Appraisal Score
        AppraisalResult appraisalResult = getLatestAppraisalScore(emp.getId());

        // 3. Self Assessment Score
        SelfAssessmentResult saResult = getLatestSelfAssessmentScore(emp);

        // 4. Feedback Score
        FeedbackResult feedbackResult = calculateFeedbackScore(emp.getId());

        // 5. PIP status
        boolean hasActivePip = pipRepository.existsByEmployeeAndStatusIn(emp, ACTIVE_PIP_STATUSES);
        String pipStatus = getLatestPipStatus(emp);

        // 5.1 Check existing proposals
        boolean hasPendingProposal = promotionProposalRepository.existsByEmployeeIdAndStatusIn(
                emp.getId(), List.of(PromotionProposalStatus.PENDING));
        boolean hasApprovedProposal = promotionProposalRepository.existsByEmployeeIdAndStatusIn(
                emp.getId(), List.of(PromotionProposalStatus.APPROVED));

        // 6. Overall rating (average of available scores, normalized to 5-point scale)
        Double overallRating = calculateOverallRating(
                kpiResult.score, appraisalResult.score, saResult.score, feedbackResult.score);

        // 7. Determine eligibility
        boolean allScoresCompleted = kpiResult.score != null
                && appraisalResult.score != null
                && saResult.score != null
                && feedbackResult.score != null;
        String performanceLevel = determinePerformanceLevel(overallRating);
        String promotionEligibility = determinePromotionEligibility(overallRating, hasActivePip, allScoresCompleted);
        
        if (hasApprovedProposal) {
            promotionEligibility = "PROMOTED";
        } else if (hasPendingProposal) {
            promotionEligibility = "PENDING PROMOTION";
        }

        boolean eligible = allScoresCompleted && !hasActivePip && overallRating != null && overallRating >= 3.5
                && !hasPendingProposal && !hasApprovedProposal;

        java.time.LocalDate joinedLocalDate = null;
        if (emp.getUserAccount() != null && emp.getUserAccount().getCreatedDate() != null) {
            joinedLocalDate = java.time.LocalDate.ofInstant(emp.getUserAccount().getCreatedDate(), java.time.ZoneId.systemDefault());
        } else if (emp.getDateOfJoining() != null) {
            joinedLocalDate = emp.getDateOfJoining();
        } else if (emp.getCreatedDate() != null) {
            joinedLocalDate = java.time.LocalDate.ofInstant(emp.getCreatedDate(), java.time.ZoneId.systemDefault());
        }
        String joinedDateStr = null;
        if (joinedLocalDate != null) {
            joinedDateStr = joinedLocalDate.toString();
        }

        // 8. Latest approved promotion proposal
        Long latestApprovedPromotionId = null;
        String latestApprovedPromotionReason = null;
        String latestApprovedPromotionEffectiveDate = null;
        String latestApprovedPromotionTargetPositionName = null;

        List<PromotionProposal> approvedProposals = promotionProposalRepository.findLatestApprovedByEmployee(emp.getId());
        if (!approvedProposals.isEmpty()) {
            PromotionProposal latest = approvedProposals.get(0);
            latestApprovedPromotionId = latest.getId();
            String remarks = latest.getRemarks();
            if (remarks != null) {
                String trimmed = remarks.trim();
                if (!trimmed.isEmpty()) {
                    latestApprovedPromotionReason = trimmed;
                }
            }
            if (latest.getEffectiveDate() != null) {
                latestApprovedPromotionEffectiveDate = latest.getEffectiveDate().toString();
            }
            if (latest.getTargetPosition() != null) {
                latestApprovedPromotionTargetPositionName = latest.getTargetPosition().getName();
            }
        }

        String profilePictureUrl = profilePictureStorageService.toPublicUrl(emp.getProfilePictureUrl());
        if (profilePictureUrl != null && !profilePictureStorageService.isAvailable(profilePictureUrl)) {
            profilePictureUrl = null;
        }

        return PerformanceReportSummaryDto.builder()
                .employeeId(emp.getId())
                .staffNo(emp.getEmployeeId())
                .employeeName(emp.getEmployeeName())
                .departmentName(emp.getDepartment() != null ? emp.getDepartment().getName() : null)
                .positionName(emp.getPosition() != null ? emp.getPosition().getName() : null)
                .profilePictureUrl(profilePictureUrl)
                .joinedDate(joinedDateStr)
                .kpiScore(kpiResult.score)
                .kpiPeriod(kpiResult.period)
                .appraisalScore(appraisalResult.score)
                .appraisalPeriod(appraisalResult.period)
                .appraisalRatingCategory(appraisalResult.ratingCategory)
                .selfAssessmentScore(saResult.score)
                .selfAssessmentCycle(saResult.cycle)
                .feedbackScore(feedbackResult.score)
                .feedbackCount(feedbackResult.count)
                .hasActivePip(hasActivePip)
                .pipStatus(pipStatus)
                .overallRating(overallRating)
                .performanceLevel(performanceLevel)
                .promotionEligibility(promotionEligibility)
                .promotionEligible(eligible)
                .latestApprovedPromotionId(latestApprovedPromotionId)
                .latestApprovedPromotionReason(latestApprovedPromotionReason)
                .latestApprovedPromotionEffectiveDate(latestApprovedPromotionEffectiveDate)
                .latestApprovedPromotionTargetPositionName(latestApprovedPromotionTargetPositionName)
                .build();
    }

    // ── KPI Score ──────────────────────────────────────────────────────

    private KpiResult calculateKpiScore(Long employeeId) {
        Optional<String> latestPeriodOpt = kpiRepository.findLatestPeriodByEmployee_Id(employeeId);
        if (latestPeriodOpt.isEmpty()) {
            return new KpiResult(null, null);
        }
        String period = latestPeriodOpt.get();
        List<EmployeeKpi> kpis = kpiRepository.findByEmployee_IdAndPeriodAndRecordStatus(employeeId, period, "Active");
        if (kpis.isEmpty()) {
            return new KpiResult(null, period);
        }

        // Use kpiTotalScore if available, otherwise calculate average of weighted scores
        Optional<BigDecimal> totalScore = kpis.stream()
                .map(EmployeeKpi::getKpiTotalScore)
                .filter(s -> s != null)
                .max(Comparator.naturalOrder());

        if (totalScore.isPresent()) {
            // Normalize: assume kpiTotalScore is 0-100 scale, convert to 5-point
            double normalized = normalizeToFivePoint(totalScore.get().doubleValue(), 100.0);
            return new KpiResult(round(normalized), period);
        }

        // Fallback: average of individual scores
        java.util.OptionalDouble avgOpt = kpis.stream()
                .filter(k -> k.getScore() != null)
                .mapToDouble(k -> k.getScore().doubleValue())
                .average();

        if (avgOpt.isEmpty()) {
            return new KpiResult(null, period);
        }

        double normalized = normalizeToFivePoint(avgOpt.getAsDouble(), 100.0);
        return new KpiResult(round(normalized), period);
    }

    // ── Appraisal Score ───────────────────────────────────────────────

    private AppraisalResult getLatestAppraisalScore(Long employeeId) {
        List<AppraisalAssignment> assignments = appraisalRepository.findByEmployeeId(employeeId);
        if (assignments.isEmpty()) {
            return new AppraisalResult(null, null, null);
        }

        // Get the latest completed one
        Optional<AppraisalAssignment> latest = assignments.stream()
                .filter(a -> a.getTotalScore() != null)
                .filter(a -> a.getStatus() == AppraisalStatus.HR_APPROVED
                        || a.getStatus() == AppraisalStatus.LOCKED
                        || a.getStatus() == AppraisalStatus.SUBMITTED)
                .max(Comparator.comparing(a -> a.getUpdatedAt() != null ? a.getUpdatedAt() : a.getCreatedAt()));

        if (latest.isEmpty()) {
            return new AppraisalResult(null, null, null);
        }

        AppraisalAssignment a = latest.get();
        String period = a.getPeriod() != null ? a.getPeriod().getName() : null;
        // Assume appraisal score is already on 5-point scale
        Double score = a.getTotalScore();
        if (score != null && score > 5.0) {
            score = normalizeToFivePoint(score, 100.0);
        }
        return new AppraisalResult(round(score), period, a.getRatingCategory());
    }

    // ── Self Assessment Score ─────────────────────────────────────────

    private SelfAssessmentResult getLatestSelfAssessmentScore(Employee emp) {
        List<SelfAssessmentForm> forms = selfAssessmentRepository.findByEmployee(emp);
        if (forms.isEmpty()) {
            return new SelfAssessmentResult(null, null);
        }

        // Get latest finalized form
        Optional<SelfAssessmentForm> latest = forms.stream()
                .filter(f -> f.getFinalApprovedTotalScore() != null
                        || f.getManagerRevisedTotalScore() != null
                        || f.getTotalScore() != null)
                .filter(f -> f.getStatus() == SelfAssessmentFormStatus.FINALIZED_LOCKED
                        || f.getStatus() == SelfAssessmentFormStatus.APPROVED)
                .max(Comparator.comparing(f -> f.getUpdatedDate() != null ? f.getUpdatedDate() : f.getCreatedDate()));

        if (latest.isEmpty()) {
            // Try any with score and is submitted/reviewed (exclude unsubmitted/draft states)
            latest = forms.stream()
                    .filter(f -> f.getTotalScore() != null)
                    .filter(f -> f.getStatus() != SelfAssessmentFormStatus.DRAFT
                            && f.getStatus() != SelfAssessmentFormStatus.NOT_STARTED
                            && f.getStatus() != SelfAssessmentFormStatus.NOT_SUBMITTED
                            && f.getStatus() != SelfAssessmentFormStatus.REOPENED)
                    .max(Comparator.comparing(f -> f.getUpdatedDate() != null ? f.getUpdatedDate() : f.getCreatedDate()));
        }

        if (latest.isEmpty()) {
            return new SelfAssessmentResult(null, null);
        }

        SelfAssessmentForm form = latest.get();
        Double score = form.getFinalApprovedTotalScore();
        if (score == null) {
            score = form.getManagerRevisedTotalScore();
        }
        if (score == null) {
            score = form.getTotalScore();
        }
        String cycle = form.getCycle() != null ? form.getCycle().getName() : null;

        // Normalize if needed (SA score could be percentage)
        if (score != null && score > 5.0) {
            score = normalizeToFivePoint(score, 100.0);
        }
        return new SelfAssessmentResult(round(score), cycle);
    }

    // ── Feedback Score ────────────────────────────────────────────────

    private FeedbackResult calculateFeedbackScore(Long employeeId) {
        var page = feedbackRepository.findByEvaluateeId(employeeId, org.springframework.data.domain.Pageable.unpaged());
        List<Feedback> feedbacks = page.getContent();
        if (feedbacks.isEmpty()) {
            return new FeedbackResult(null, 0);
        }

        double avg = feedbacks.stream()
                .filter(f -> f.getScore() != null)
                .mapToDouble(Feedback::getScore)
                .average()
                .orElse(0.0);

        // Normalize to 5-point if needed
        if (avg > 5.0) {
            avg = normalizeToFivePoint(avg, 100.0);
        }
        return new FeedbackResult(round(avg), feedbacks.size());
    }

    // ── PIP Status ────────────────────────────────────────────────────

    private String getLatestPipStatus(Employee emp) {
        List<Pip> pips = pipRepository.findByEmployee(emp);
        if (pips.isEmpty()) {
            return null;
        }
        return pips.stream()
                .max(Comparator.comparing(p -> p.getCreatedDate() != null ? p.getCreatedDate() : java.time.Instant.MIN))
                .map(Pip::getStatus)
                .orElse(null);
    }

    // ── Overall Rating ────────────────────────────────────────────────

    private Double calculateOverallRating(Double kpi, Double appraisal, Double sa, Double feedback) {
        List<Double> scores = new ArrayList<>();
        if (kpi != null) scores.add(kpi);
        if (appraisal != null) scores.add(appraisal);
        if (sa != null) scores.add(sa);
        if (feedback != null) scores.add(feedback);

        if (scores.size() < 2) {
            return null;
        }

        double avg = scores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        return round(avg);
    }

    // ── Performance Level & Eligibility ───────────────────────────────

    private String determinePerformanceLevel(Double rating) {
        if (rating == null) return "No Data";
        if (rating >= 4.5) return "Excellent";
        if (rating >= 3.5) return "Good";
        if (rating >= 2.5) return "Meet Requirement";
        if (rating >= 1.5) return "Needs Improvement";
        return "Unsatisfactory";
    }

    private String determinePromotionEligibility(Double rating, boolean hasActivePip, boolean allScoresCompleted) {
        if (rating == null) return "No Data";
        if (hasActivePip) return "Not eligible";
        if (!allScoresCompleted) return "Not eligible";
        if (rating >= 4.5) return "Strongly recommended";
        if (rating >= 3.5) return "Eligible";
        if (rating >= 2.5) return "Possible";
        return "Not eligible";
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private double normalizeToFivePoint(double score, double maxScale) {
        if (maxScale <= 0) return 0;
        return (score / maxScale) * 5.0;
    }

    private Double round(Double value) {
        if (value == null) return null;
        return Math.round(value * 10.0) / 10.0;
    }

    // ── Inner result records ──────────────────────────────────────────

    private record KpiResult(Double score, String period) {}
    private record AppraisalResult(Double score, String period, String ratingCategory) {}
    private record SelfAssessmentResult(Double score, String cycle) {}
    private record FeedbackResult(Double score, int count) {}
}
