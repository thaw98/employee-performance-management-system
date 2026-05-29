package com.epms.backend.service;

import com.epms.backend.StaffTypes;
import com.epms.backend.audit.AuditActionType;
import com.epms.backend.audit.AuditTargetType;
import com.epms.backend.dto.FeedbackDraftDto;
import com.epms.backend.dto.FeedbackAuditEvaluateeHistoryDto;
import com.epms.backend.dto.FeedbackAuditHistoryFilter;
import com.epms.backend.dto.FeedbackAuditSummaryPageDto;
import com.epms.backend.dto.FeedbackAuditSummaryRowDto;
import com.epms.backend.dto.FeedbackAuditTotalsDto;
import com.epms.backend.dto.FeedbackHistoryFilter;
import com.epms.backend.dto.FeedbackHistoryDto;
import com.epms.backend.dto.FeedbackDetailPageDto;
import com.epms.backend.dto.FeedbackChatMessageDto;
import com.epms.backend.dto.FeedbackChatMessageRequest;
import com.epms.backend.dto.FeedbackSubmissionRequest;
import com.epms.backend.entity.*;
import com.epms.backend.repository.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.HashMap;
import java.util.LinkedHashMap;

@Service
public class FeedbackService {
    private static final int ADDITIONAL_COMMENTS_MAX_LENGTH = 1000;
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();


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
    private final AuditService auditService;
    private final FeedbackChatMessageRepository feedbackChatMessageRepository;

    @Autowired
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
            ReviewCycleRepository reviewCycleRepository,
            AuditService auditService,
            FeedbackChatMessageRepository feedbackChatMessageRepository) {
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
        this.auditService = auditService;
        this.feedbackChatMessageRepository = feedbackChatMessageRepository;
    }

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
            ReviewCycleRepository reviewCycleRepository,
            AuditService auditService) {
        this(feedbackRepository, feedbackDraftRepository, employeeRepository, reportingManagerResolver,
                criteriaRepository, userRepository, notificationService, timeSettingService, reviewCycleService,
                reviewCycleRepository, auditService, null);
    }

    /* Reporting helpers */
    public List<com.epms.backend.dto.FeedbackReportDtos.CriteriaAverageDto> getCriteriaAveragesForDepartment(Long departmentId, LocalDate fromDate, LocalDate toDate) {
        return getCriteriaAveragesForDepartment(departmentId, fromDate, toDate, null);
    }

    public List<com.epms.backend.dto.FeedbackReportDtos.CriteriaAverageDto> getCriteriaAveragesForDepartment(Long departmentId, LocalDate fromDate, LocalDate toDate, Long reviewCycleId) {
        Instant start = fromDate != null ? fromDate.atStartOfDay(ZoneId.systemDefault()).toInstant() : Instant.EPOCH;
        Instant end = toDate != null ? toDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).minusNanos(1).toInstant() : Instant.now();

        ReviewCycle reviewCycle = reviewCycleId != null ? reviewCycleRepository.findById(reviewCycleId).orElse(null) : null;

        List<Feedback> feedbacks = feedbackRepository.findAll().stream()
                .filter(f -> f.getEvaluatee() != null && f.getEvaluatee().getDepartment() != null)
                .filter(f -> departmentId == null || f.getEvaluatee().getDepartment().getId().equals(departmentId))
                .filter(f -> matchesReviewCycle(f, reviewCycle))
                .filter(f -> !f.getCreatedDate().isBefore(start) && !f.getCreatedDate().isAfter(end))
                .collect(Collectors.toList());

        Map<Long, double[]> agg = new HashMap<>(); // criteriaId -> [sum, count]
        Map<Long, String> names = new HashMap<>();

        for (Feedback f : feedbacks) {
            if (f.getDetails() == null) continue;
            for (FeedbackDetail d : f.getDetails()) {
                Long cid = d.getCriteria().getId();
                names.putIfAbsent(cid, d.getCriteria().getName());
                double[] arr = agg.computeIfAbsent(cid, k -> new double[2]);
                arr[0] += d.getRating();
                arr[1] += 1;
            }
        }

        return agg.entrySet().stream()
                .map(e -> new com.epms.backend.dto.FeedbackReportDtos.CriteriaAverageDto(
                        e.getKey(),
                        names.get(e.getKey()),
                        e.getValue()[1] > 0 ? e.getValue()[0] / e.getValue()[1] : 0d
                ))
                .sorted((a, b) -> a.getCriteriaName().compareToIgnoreCase(b.getCriteriaName()))
                .collect(Collectors.toList());
    }

    public List<com.epms.backend.dto.FeedbackReportDtos.EmployeeRankingDto> getEmployeeRankingForDepartment(Long departmentId, LocalDate fromDate, LocalDate toDate, Long criteriaId, boolean asc) {
        return getEmployeeRankingForDepartment(departmentId, fromDate, toDate, criteriaId, asc, null);
    }

    public List<com.epms.backend.dto.FeedbackReportDtos.EmployeeRankingDto> getEmployeeRankingForDepartment(Long departmentId, LocalDate fromDate, LocalDate toDate, Long criteriaId, boolean asc, Long reviewCycleId) {
        Instant start = fromDate != null ? fromDate.atStartOfDay(ZoneId.systemDefault()).toInstant() : Instant.EPOCH;
        Instant end = toDate != null ? toDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).minusNanos(1).toInstant() : Instant.now();

        ReviewCycle reviewCycle = reviewCycleId != null ? reviewCycleRepository.findById(reviewCycleId).orElse(null) : null;

        List<Feedback> feedbacks = feedbackRepository.findAll().stream()
                .filter(f -> f.getEvaluatee() != null && f.getEvaluatee().getDepartment() != null)
                .filter(f -> departmentId == null || f.getEvaluatee().getDepartment().getId().equals(departmentId))
                .filter(f -> matchesReviewCycle(f, reviewCycle))
                .filter(f -> !f.getCreatedDate().isBefore(start) && !f.getCreatedDate().isAfter(end))
                .collect(Collectors.toList());

        Map<Long, double[]> agg = new HashMap<>(); // empId -> [sum, count]
        Map<Long, String> names = new HashMap<>();
        Map<Long, Long> departmentIds = new HashMap<>();
        Map<Long, String> departmentNames = new HashMap<>();

        for (Feedback f : feedbacks) {
            Long eid = f.getEvaluatee().getId();
            names.putIfAbsent(eid, f.getEvaluatee().getEmployeeName());
            departmentIds.putIfAbsent(eid, f.getEvaluatee().getDepartment().getId());
            departmentNames.putIfAbsent(eid, f.getEvaluatee().getDepartment().getName());
            if (criteriaId == null) {
                double[] arr = agg.computeIfAbsent(eid, k -> new double[2]);
                arr[0] += f.getScore() != null ? f.getScore() : 0d;
                arr[1] += 1;
            } else {
                // average only ratings for the specified criteria across feedback details
                if (f.getDetails() == null) continue;
                double sum = 0; double cnt = 0;
                for (FeedbackDetail d : f.getDetails()) {
                    if (d.getCriteria() != null && d.getCriteria().getId().equals(criteriaId)) {
                        sum += d.getRating(); cnt += 1;
                    }
                }
                if (cnt > 0) {
                    double[] arr = agg.computeIfAbsent(eid, k -> new double[2]);
                    arr[0] += (sum / cnt) * 20.0; // convert rating (1-5) to percentage-like scale comparable to f.getScore()
                    arr[1] += 1;
                }
            }
        }

        List<com.epms.backend.dto.FeedbackReportDtos.EmployeeRankingDto> result = agg.entrySet().stream()
                .map(e -> new com.epms.backend.dto.FeedbackReportDtos.EmployeeRankingDto(
                        e.getKey(),
                        names.get(e.getKey()),
                        departmentIds.get(e.getKey()),
                        departmentNames.get(e.getKey()),
                        e.getValue()[1] > 0 ? e.getValue()[0] / e.getValue()[1] : 0d
                ))
                .sorted((a, b) -> asc ? Double.compare(a.getAverageScore(), b.getAverageScore()) : Double.compare(b.getAverageScore(), a.getAverageScore()))
                .collect(Collectors.toList());

        return result;
    }

    public boolean employeeBelongsToDepartment(Long employeeId, Long departmentId) {
        return employeeRepository.findById(employeeId)
                .map(employee -> employee.getDepartment() != null && employee.getDepartment().getId().equals(departmentId))
                .orElse(false);
    }

    public com.epms.backend.dto.FeedbackReportDtos.EmployeeFeedbackDetailReportDto getEmployeeFeedbackDetailForDepartment(
            Long departmentId,
            Long employeeId,
            LocalDate fromDate,
            LocalDate toDate) {
        return getEmployeeFeedbackDetailForDepartment(departmentId, employeeId, fromDate, toDate, null);
    }

    public com.epms.backend.dto.FeedbackReportDtos.EmployeeFeedbackDetailReportDto getEmployeeFeedbackDetailForDepartment(
            Long departmentId,
            Long employeeId,
            LocalDate fromDate,
            LocalDate toDate,
            Long reviewCycleId) {
        Instant start = fromDate != null ? fromDate.atStartOfDay(ZoneId.systemDefault()).toInstant() : Instant.EPOCH;
        Instant end = toDate != null ? toDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).minusNanos(1).toInstant() : Instant.now();

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        ReviewCycle reviewCycle = reviewCycleId != null ? reviewCycleRepository.findById(reviewCycleId).orElse(null) : null;

        List<Feedback> feedbacks = feedbackRepository.findAll().stream()
                .filter(f -> f.getEvaluatee() != null && f.getEvaluatee().getId().equals(employeeId))
                .filter(f -> f.getEvaluatee().getDepartment() != null
                        && f.getEvaluatee().getDepartment().getId().equals(departmentId))
                .filter(f -> matchesReviewCycle(f, reviewCycle))
                .filter(f -> !f.getCreatedDate().isBefore(start) && !f.getCreatedDate().isAfter(end))
                .collect(Collectors.toList());

        Map<Long, double[]> criteriaAgg = new HashMap<>();
        Map<Long, String> criteriaNames = new HashMap<>();
        double total = 0d;
        double count = 0d;

        for (Feedback feedback : feedbacks) {
            if (feedback.getDetails() == null) continue;
            for (FeedbackDetail detail : feedback.getDetails()) {
                if (detail.getCriteria() == null || detail.getRating() == null) continue;
                Long criteriaId = detail.getCriteria().getId();
                criteriaNames.putIfAbsent(criteriaId, detail.getCriteria().getName());
                double[] arr = criteriaAgg.computeIfAbsent(criteriaId, key -> new double[2]);
                arr[0] += detail.getRating();
                arr[1] += 1;
                total += detail.getRating();
                count += 1;
            }
        }
        List<String> additionalComments = feedbacks.stream()
                .map(Feedback::getAdditionalComments)
                .filter(this::hasText)
                .collect(Collectors.toList());

        List<com.epms.backend.dto.FeedbackReportDtos.EmployeeCriteriaAverageDto> criteriaAverages = criteriaAgg.entrySet().stream()
                .map(entry -> new com.epms.backend.dto.FeedbackReportDtos.EmployeeCriteriaAverageDto(
                        entry.getKey(),
                        criteriaNames.get(entry.getKey()),
                        entry.getValue()[1] > 0 ? entry.getValue()[0] / entry.getValue()[1] : 0d
                ))
                .sorted((a, b) -> a.getCriteriaName().compareToIgnoreCase(b.getCriteriaName()))
                .collect(Collectors.toList());

        Department department = employee.getDepartment();
        return new com.epms.backend.dto.FeedbackReportDtos.EmployeeFeedbackDetailReportDto(
                employee.getId(),
                employee.getEmployeeName(),
                department != null ? department.getId() : null,
                department != null ? department.getName() : null,
                count > 0 ? total / count : 0d,
                criteriaAverages,
                additionalComments);
    }

    public com.epms.backend.dto.FeedbackReportDtos.TopBottomEmployeeSummaryDto getTopBottomEmployeeSummary(
            Long departmentId,
            LocalDate fromDate,
            LocalDate toDate) {
        return getTopBottomEmployeeSummary(departmentId, fromDate, toDate, null);
    }

    public com.epms.backend.dto.FeedbackReportDtos.TopBottomEmployeeSummaryDto getTopBottomEmployeeSummary(
            Long departmentId,
            LocalDate fromDate,
            LocalDate toDate,
            Long reviewCycleId) {
        Instant start = fromDate != null ? fromDate.atStartOfDay(ZoneId.systemDefault()).toInstant() : Instant.EPOCH;
        Instant end = toDate != null ? toDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).minusNanos(1).toInstant() : Instant.now();

        ReviewCycle reviewCycle = reviewCycleId != null ? reviewCycleRepository.findById(reviewCycleId).orElse(null) : null;

        List<Feedback> feedbacks = feedbackRepository.findAll().stream()
                .filter(f -> f.getEvaluatee() != null && f.getEvaluatee().getDepartment() != null)
                .filter(f -> departmentId == null || f.getEvaluatee().getDepartment().getId().equals(departmentId))
                .filter(f -> matchesReviewCycle(f, reviewCycle))
                .filter(f -> !f.getCreatedDate().isBefore(start) && !f.getCreatedDate().isAfter(end))
                .collect(Collectors.toList());

        Map<Long, double[]> agg = new HashMap<>();
        Map<Long, String> names = new HashMap<>();
        Map<Long, Long> departmentIds = new HashMap<>();
        Map<Long, String> departmentNames = new HashMap<>();

        for (Feedback feedback : feedbacks) {
            Long employeeId = feedback.getEvaluatee().getId();
            names.putIfAbsent(employeeId, feedback.getEvaluatee().getEmployeeName());
            departmentIds.putIfAbsent(employeeId, feedback.getEvaluatee().getDepartment().getId());
            departmentNames.putIfAbsent(employeeId, feedback.getEvaluatee().getDepartment().getName());
            double[] arr = agg.computeIfAbsent(employeeId, key -> new double[2]);
            arr[0] += feedback.getScore() != null ? feedback.getScore() : 0d;
            arr[1] += 1;
        }

        List<com.epms.backend.dto.FeedbackReportDtos.EmployeeRankingDto> employees = agg.entrySet().stream()
                .map(entry -> new com.epms.backend.dto.FeedbackReportDtos.EmployeeRankingDto(
                        entry.getKey(),
                        names.get(entry.getKey()),
                        departmentIds.get(entry.getKey()),
                        departmentNames.get(entry.getKey()),
                        entry.getValue()[1] > 0 ? entry.getValue()[0] / entry.getValue()[1] : 0d))
                .sorted((a, b) -> Double.compare(b.getAverageScore(), a.getAverageScore()))
                .collect(Collectors.toList());

        com.epms.backend.dto.FeedbackReportDtos.EmployeeRankingDto top = employees.isEmpty() ? null : employees.get(0);
        com.epms.backend.dto.FeedbackReportDtos.EmployeeRankingDto bottom = employees.isEmpty() ? null : employees.get(employees.size() - 1);
        return new com.epms.backend.dto.FeedbackReportDtos.TopBottomEmployeeSummaryDto(top, bottom);
    }

    public List<com.epms.backend.dto.FeedbackReportDtos.DepartmentAverageDto> getAverageByDepartment(LocalDate fromDate, LocalDate toDate) {
        return getAverageByDepartment(fromDate, toDate, null);
    }

    public List<com.epms.backend.dto.FeedbackReportDtos.DepartmentAverageDto> getAverageByDepartment(LocalDate fromDate, LocalDate toDate, Long reviewCycleId) {
        Instant start = fromDate != null ? fromDate.atStartOfDay(ZoneId.systemDefault()).toInstant() : Instant.EPOCH;
        Instant end = toDate != null ? toDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).minusNanos(1).toInstant() : Instant.now();

        ReviewCycle reviewCycle = reviewCycleId != null ? reviewCycleRepository.findById(reviewCycleId).orElse(null) : null;

        List<Feedback> feedbacks = feedbackRepository.findAll().stream()
                .filter(f -> f.getEvaluatee() != null && f.getEvaluatee().getDepartment() != null)
                .filter(f -> matchesReviewCycle(f, reviewCycle))
                .filter(f -> !f.getCreatedDate().isBefore(start) && !f.getCreatedDate().isAfter(end))
                .collect(Collectors.toList());

        Map<Long, double[]> agg = new HashMap<>(); // deptId -> [sum, count]
        Map<Long, String> names = new HashMap<>();

        for (Feedback f : feedbacks) {
            Long did = f.getEvaluatee().getDepartment().getId();
            names.putIfAbsent(did, f.getEvaluatee().getDepartment().getName());
            double[] arr = agg.computeIfAbsent(did, k -> new double[2]);
            arr[0] += f.getScore();
            arr[1] += 1;
        }

        return agg.entrySet().stream()
                .map(e -> new com.epms.backend.dto.FeedbackReportDtos.DepartmentAverageDto(
                        e.getKey(),
                        names.get(e.getKey()),
                        e.getValue()[1] > 0 ? e.getValue()[0] / e.getValue()[1] : 0d
                ))
                .sorted((a, b) -> b.getAverageScore().compareTo(a.getAverageScore()))
                .collect(Collectors.toList());
    }

    public List<com.epms.backend.dto.FeedbackReportDtos.DepartmentTrendDto> getDepartmentTrends(LocalDate fromDate, LocalDate toDate) {
        return getDepartmentTrends(fromDate, toDate, null, null);
    }

    public List<com.epms.backend.dto.FeedbackReportDtos.DepartmentTrendDto> getDepartmentTrends(LocalDate fromDate, LocalDate toDate, Long fromReviewCycleId, Long toReviewCycleId) {
        Instant start = fromDate != null ? fromDate.atStartOfDay(ZoneId.systemDefault()).toInstant() : Instant.EPOCH;
        Instant end = toDate != null ? toDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).minusNanos(1).toInstant() : Instant.now();
        ReviewCycle fromCycle = fromReviewCycleId != null ? reviewCycleRepository.findById(fromReviewCycleId).orElse(null) : null;
        ReviewCycle toCycle = toReviewCycleId != null ? reviewCycleRepository.findById(toReviewCycleId).orElse(null) : null;

        List<Feedback> feedbacks = feedbackRepository.findAll().stream()
                .filter(f -> f.getEvaluatee() != null && f.getEvaluatee().getDepartment() != null)
                .filter(f -> isFeedbackWithinCycleRange(f, fromCycle, toCycle))
                .filter(f -> !f.getCreatedDate().isBefore(start) && !f.getCreatedDate().isAfter(end))
                .collect(Collectors.toList());

        boolean annualTrend = isAnnualCycle(fromCycle) || isAnnualCycle(toCycle);
        Map<String, ReviewCycle> cycleLookup = new HashMap<>();
        for (Feedback feedback : feedbacks) {
            ReviewCycle cycle = getTrendCycle(feedback, annualTrend);
            String period = getFeedbackCycleLabel(feedback, annualTrend);
            if (cycle != null) {
                cycleLookup.putIfAbsent(period, cycle);
            }
        }

        List<String> periods = feedbacks.stream()
                .map(feedback -> getFeedbackCycleLabel(feedback, annualTrend))
                .distinct()
                .sorted((left, right) -> compareFeedbackCycleLabels(left, right, cycleLookup))
                .collect(Collectors.toList());

        Map<Long, Map<String, double[]>> data = new LinkedHashMap<>();
        Map<Long, String> deptNames = new HashMap<>();

        for (Feedback f : feedbacks) {
            Long did = f.getEvaluatee().getDepartment().getId();
            deptNames.putIfAbsent(did, f.getEvaluatee().getDepartment().getName());
            String period = getFeedbackCycleLabel(f, annualTrend);
            Map<String, double[]> per = data.computeIfAbsent(did, k -> new LinkedHashMap<>());
            double[] arr = per.computeIfAbsent(period, k -> new double[2]);
            arr[0] += f.getScore() != null ? f.getScore() : 0d; arr[1] += 1;
        }

        List<com.epms.backend.dto.FeedbackReportDtos.DepartmentTrendDto> result = new ArrayList<>();
        for (Map.Entry<Long, Map<String,double[]>> entry : data.entrySet()) {
            Long did = entry.getKey();
            List<com.epms.backend.dto.FeedbackReportDtos.DepartmentTrendPoint> points = new ArrayList<>();
            Map<String,double[]> per = entry.getValue();
            for (String period : periods) {
                double[] arr = per.getOrDefault(period, new double[2]);
                double avg = arr[1] > 0 ? arr[0] / arr[1] : 0d;
                points.add(new com.epms.backend.dto.FeedbackReportDtos.DepartmentTrendPoint(period, avg));
            }
            result.add(new com.epms.backend.dto.FeedbackReportDtos.DepartmentTrendDto(did, deptNames.get(did), points));
        }

        return result;
    }

    public List<com.epms.backend.dto.FeedbackReportDtos.EmployeeFeedbackDetailReportDto> getEmployeeFeedbackDetailsForReport(
            Long departmentId,
            LocalDate fromDate,
            LocalDate toDate,
            Long reviewCycleId) {
        return getEmployeeRankingForDepartment(departmentId, fromDate, toDate, null, false, reviewCycleId).stream()
                .filter(employee -> employee.getDepartmentId() != null)
                .map(employee -> getEmployeeFeedbackDetailForDepartment(
                        employee.getDepartmentId(),
                        employee.getEmployeeId(),
                        fromDate,
                        toDate,
                        reviewCycleId))
                .collect(Collectors.toList());
    }

    private boolean isFeedbackWithinCycleRange(Feedback feedback, ReviewCycle fromCycle, ReviewCycle toCycle) {
        ReviewCycle feedbackCycle = feedback.getReviewCycle();
        LocalDate start = feedbackCycle != null
                ? feedbackCycle.getStartDate()
                : LocalDate.ofInstant(feedback.getCreatedDate(), ZoneId.systemDefault());
        if (fromCycle != null && start.isBefore(fromCycle.getStartDate())) {
            return false;
        }
        return toCycle == null || !start.isAfter(toCycle.getEndDate());
    }

    private boolean matchesReviewCycle(Feedback feedback, ReviewCycle reviewCycle) {
        if (reviewCycle == null) {
            return true;
        }
        ReviewCycle feedbackCycle = feedback.getReviewCycle();
        if (feedbackCycle != null) {
            return feedbackCycle.getId().equals(reviewCycle.getId());
        }
        LocalDate feedbackDate = LocalDate.ofInstant(feedback.getCreatedDate(), ZoneId.systemDefault());
        return !feedbackDate.isBefore(reviewCycle.getStartDate()) && !feedbackDate.isAfter(reviewCycle.getEndDate());
    }

    private String getFeedbackCycleLabel(Feedback feedback) {
        return getFeedbackCycleLabel(feedback, false);
    }

    private String getFeedbackCycleLabel(Feedback feedback, boolean annualTrend) {
        ReviewCycle cycle = getTrendCycle(feedback, annualTrend);
        if (cycle != null) {
            if (cycle.getName() != null && !cycle.getName().isBlank()) {
                return cycle.getName();
            }
            if (cycle.getCode() != null && !cycle.getCode().isBlank()) {
                return cycle.getCode();
            }
        }
        return "Unassigned Cycle";
    }

    private ReviewCycle getTrendCycle(Feedback feedback, boolean annualTrend) {
        ReviewCycle cycle = feedback.getReviewCycle();
        if (!annualTrend || cycle == null) {
            return cycle;
        }
        if (isAnnualCycle(cycle)) {
            return cycle;
        }
        return cycle.getParentCycle() != null ? cycle.getParentCycle() : cycle;
    }

    private boolean isAnnualCycle(ReviewCycle cycle) {
        return cycle != null && ReviewCycle.CycleType.ANNUAL.equals(cycle.getCycleType());
    }

    private int compareFeedbackCycleLabels(String left, String right, Map<String, ReviewCycle> cycleLookup) {
        ReviewCycle leftCycle = cycleLookup.get(left);
        ReviewCycle rightCycle = cycleLookup.get(right);
        if (leftCycle != null && rightCycle != null) {
            int startCompare = leftCycle.getStartDate().compareTo(rightCycle.getStartDate());
            if (startCompare != 0) {
                return startCompare;
            }
            return left.compareToIgnoreCase(right);
        }
        if (leftCycle != null) {
            return -1;
        }
        if (rightCycle != null) {
            return 1;
        }
        return left.compareToIgnoreCase(right);
    }

    @Transactional
    public void submitFeedback(Long evaluatorId, FeedbackSubmissionRequest request) {
        String additionalComments = normalizeAdditionalComments(request.getAdditionalComments());
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
        feedback.setAdditionalComments(additionalComments);
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

        Feedback savedFeedback = feedbackRepository.save(feedback);
        recordFeedbackSubmittedAudit(savedFeedback);

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
        return feedbackPage.map(feedback -> mapToHistoryDto(feedback, "GIVEN"));
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

    @Transactional(readOnly = true)
    public Page<FeedbackHistoryDto> getCombinedFeedbackHistory(Long employeeId, FeedbackHistoryFilter filter, Pageable pageable) {
        Page<Feedback> feedbackPage = feedbackRepository.findAll(combinedHistorySpec(employeeId, filter), pageable);
        return feedbackPage.map(feedback -> {
            boolean given = feedback.getEvaluator() != null && employeeId.equals(feedback.getEvaluator().getId());
            boolean received = feedback.getEvaluatee() != null && employeeId.equals(feedback.getEvaluatee().getId());
            if (received && !given) {
                return mapToReceivedHistoryDto(feedback, "RECEIVED", true);
            }
            return mapToHistoryDto(feedback, "GIVEN");
        });
    }

    @Transactional(readOnly = true)
    public FeedbackAuditSummaryPageDto getAuditHistorySummary(FeedbackAuditHistoryFilter filter, Pageable pageable) {
        List<Feedback> feedbacks = feedbackRepository.findAll(auditHistorySpec(filter));
        Map<Long, List<Feedback>> grouped = feedbacks.stream()
                .filter(feedback -> feedback.getEvaluatee() != null)
                .collect(Collectors.groupingBy(feedback -> feedback.getEvaluatee().getId()));

        List<FeedbackAuditSummaryRowDto> rows = grouped.values().stream()
                .map(group -> buildAuditSummaryRow(group.get(0).getEvaluatee(), group, filter))
                .sorted(Comparator.comparing(
                        FeedbackAuditSummaryRowDto::getLatestFeedbackDate,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());

        int start = Math.min((int) pageable.getOffset(), rows.size());
        int end = Math.min(start + pageable.getPageSize(), rows.size());
        List<FeedbackAuditSummaryRowDto> pageRows = rows.subList(start, end);
        long totalFeedbackCount = feedbacks.size();
        long anonymousCount = feedbacks.stream().filter(f -> Boolean.TRUE.equals(f.getAnonymous())).count();
        double scoreSum = feedbacks.stream().map(Feedback::getScore).filter(score -> score != null).mapToDouble(Double::doubleValue).sum();
        long scoreCount = feedbacks.stream().map(Feedback::getScore).filter(score -> score != null).count();
        FeedbackAuditTotalsDto totals = new FeedbackAuditTotalsDto(
                (long) rows.size(),
                totalFeedbackCount,
                anonymousCount,
                totalFeedbackCount - anonymousCount,
                scoreCount > 0 ? scoreSum / scoreCount : 0d);
        int totalPages = pageable.getPageSize() > 0 ? (int) Math.ceil((double) rows.size() / pageable.getPageSize()) : 0;
        return new FeedbackAuditSummaryPageDto(pageRows, pageable.getPageNumber(), pageable.getPageSize(), totalPages, (long) rows.size(), totals);
    }

    @Transactional(readOnly = true)
    public FeedbackAuditEvaluateeHistoryDto getAuditEvaluateeHistory(Long employeeId, FeedbackAuditHistoryFilter filter, Pageable pageable) {
        Employee evaluatee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Evaluatee not found"));
        List<Feedback> allRows = feedbackRepository.findAll(auditHistorySpec(filter)).stream()
                .filter(feedback -> feedback.getEvaluatee() != null && employeeId.equals(feedback.getEvaluatee().getId()))
                .sorted(Comparator.comparing(Feedback::getCreatedDate, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
        int start = Math.min((int) pageable.getOffset(), allRows.size());
        int end = Math.min(start + pageable.getPageSize(), allRows.size());
        List<FeedbackHistoryDto> content = allRows.subList(start, end).stream()
                .map(feedback -> mapToHistoryDto(feedback, "RECEIVED"))
                .collect(Collectors.toList());
        Page<FeedbackHistoryDto> history = new PageImpl<>(content, pageable, allRows.size());
        return new FeedbackAuditEvaluateeHistoryDto(buildAuditSummaryRow(evaluatee, allRows, filter), history);
    }

    @Transactional
    public FeedbackDraftDto saveDraft(Long evaluatorId, FeedbackSubmissionRequest request) {
        cleanupExpiredDrafts();
        String additionalComments = normalizeAdditionalComments(request.getAdditionalComments());
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
        draft.setAdditionalComments(additionalComments);
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
        return mapToHistoryDto(entity, null);
    }

    private FeedbackHistoryDto mapToHistoryDto(Feedback entity, String direction) {
        FeedbackHistoryDto dto = new FeedbackHistoryDto();
        Employee evaluator = entity.getEvaluator();
        Employee evaluatee = entity.getEvaluatee();
        dto.setId(entity.getId());
        dto.setDate(entity.getCreatedDate());
        dto.setDirection(direction);
        dto.setEvaluatorName(evaluator != null ? evaluator.getEmployeeName() : null);
        dto.setEvaluatorStaffNo(evaluator != null ? evaluator.getEmployeeId() : null);
        dto.setEvaluatorPosition(employeePositionName(evaluator));
        dto.setEvaluatorDepartment(employeeDepartmentName(evaluator));
        dto.setEvaluateeName(evaluatee != null ? evaluatee.getEmployeeName() : null);
        dto.setEvaluateeStaffNo(evaluatee != null ? evaluatee.getEmployeeId() : null);
        dto.setEvaluateePosition(employeePositionName(evaluatee));
        dto.setEvaluateeDepartment(employeeDepartmentName(evaluatee));
        dto.setPosition(dto.getEvaluateePosition());
        dto.setRole(entity.getRole());
        dto.setScore(entity.getScore());
        dto.setRemark(entity.getRemark());
        dto.setAnonymous(Boolean.TRUE.equals(entity.getAnonymous()));
        dto.setAdditionalComments(entity.getAdditionalComments());
        dto.setStatus("SUBMITTED");
        ReviewCycle cycle = entity.getReviewCycle();
        if (cycle != null) {
            dto.setReviewCycleId(cycle.getId());
            dto.setReviewCycleName(cycle.getName());
            dto.setReviewCycleStartDate(cycle.getStartDate());
        } else {
            cycle = resolveCycleForDate(entity.getCreatedDate());
            if (cycle != null) {
                dto.setReviewCycleId(cycle.getId());
                dto.setReviewCycleName(cycle.getName());
                dto.setReviewCycleStartDate(cycle.getStartDate());
            }
        }
        return dto;
    }

    private String employeePositionName(Employee employee) {
        return employee != null && employee.getPosition() != null ? employee.getPosition().getName() : null;
    }

    private String employeeDepartmentName(Employee employee) {
        return employee != null && employee.getDepartment() != null ? employee.getDepartment().getName() : null;
    }

    private FeedbackHistoryDto mapToReceivedHistoryDto(Feedback entity) {
        return mapToReceivedHistoryDto(entity, null, false);
    }

    private FeedbackHistoryDto mapToReceivedHistoryDto(Feedback entity, String direction, boolean hideAnonymousEvaluatorDetails) {
        FeedbackHistoryDto dto = mapToHistoryDto(entity, direction);

        if (Boolean.TRUE.equals(entity.getAnonymous())) {
            dto.setEvaluatorName("Anonymous");
            if (hideAnonymousEvaluatorDetails) {
                dto.setEvaluatorStaffNo(null);
                dto.setEvaluatorPosition(null);
                dto.setEvaluatorDepartment(null);
            }
        } else {
            dto.setEvaluatorName(entity.getEvaluator() != null ? entity.getEvaluator().getEmployeeName() : null);
        }

        // Invert the role for the recipient's view
        dto.setRole(getEvaluatorRoleRelation(entity.getRole()).toUpperCase());

        return dto;
    }

    private String getEvaluatorRoleRelation(String evaluateeRoleRelation) {
        if ("SELF".equalsIgnoreCase(evaluateeRoleRelation))
            return "Self";
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

        return mapFeedbackDetails(feedback);
    }

    @Transactional(readOnly = true)
    public List<FeedbackChatMessageDto> getFeedbackChatMessages(Long feedbackId, Long currentEmployeeId) {
        Feedback feedback = getFeedbackForChat(feedbackId, currentEmployeeId);
        return feedbackChatMessageRepository.findByFeedback_IdOrderByCreatedDateAsc(feedback.getId()).stream()
                .map(this::mapFeedbackChatMessage)
                .collect(Collectors.toList());
    }

    @Transactional
    public FeedbackChatMessageDto addFeedbackChatMessage(Long feedbackId, Long currentEmployeeId, FeedbackChatMessageRequest request) {
        Feedback feedback = getFeedbackForChat(feedbackId, currentEmployeeId);
        String content = request == null || request.content() == null ? "" : request.content().trim();
        if (content.isEmpty()) {
            throw new RuntimeException("Message content is required");
        }
        Employee author = currentEmployeeId.equals(feedback.getEvaluator().getId())
                ? feedback.getEvaluator()
                : feedback.getEvaluatee();
        Employee recipient = currentEmployeeId.equals(feedback.getEvaluator().getId())
                ? feedback.getEvaluatee()
                : feedback.getEvaluator();

        FeedbackChatMessage message = new FeedbackChatMessage();
        message.setFeedback(feedback);
        message.setAuthor(author);
        message.setContent(content);
        message.setCreatedDate(Instant.now());
        message = feedbackChatMessageRepository.save(message);

        if (recipient != null && recipient.getUserAccount() != null) {
            // Use "Anonymous" as the author name in the notification when the feedback is anonymous,
            // to avoid revealing the real evaluator's identity.
            String notifAuthorName = Boolean.TRUE.equals(feedback.getAnonymous())
                    ? "Anonymous"
                    : author.getEmployeeName();

            // Embed a recipient marker so the frontend can route the notification correctly:
            //   [EVALUATOR_RECIPIENT] → the recipient of this notification is the feedback GIVER
            //                           → frontend routes to Feedback History
            //   [EVALUATEE_RECIPIENT] → the recipient is the feedback RECEIVER
            //                           → frontend routes to Received Feedback
            boolean recipientIsEvaluator = recipient.getUserAccount() != null
                    && feedback.getEvaluator() != null
                    && feedback.getEvaluator().getUserAccount() != null
                    && feedback.getEvaluator().getUserAccount().getId()
                        .equals(recipient.getUserAccount().getId());
            String recipientMarker = recipientIsEvaluator ? " [EVALUATOR_RECIPIENT]" : " [EVALUATEE_RECIPIENT]";

            notificationService.send(
                    recipient.getUserAccount(),
                    "New Feedback Chat Message",
                    notifAuthorName + " sent a feedback chat message for feedback #"
                            + feedback.getId() + " at "
                            + DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm").withZone(ZoneId.systemDefault()).format(message.getCreatedDate())
                            + recipientMarker,
                    "360_FEEDBACK");
        }

        return mapFeedbackChatMessage(message);
    }

    @Transactional(readOnly = true)
    public FeedbackDetailPageDto getFeedbackDetailPage(Long feedbackId, Long currentEmployeeId) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Feedback not found"));

        boolean given = feedback.getEvaluator() != null && currentEmployeeId.equals(feedback.getEvaluator().getId());
        boolean received = feedback.getEvaluatee() != null && currentEmployeeId.equals(feedback.getEvaluatee().getId());
        if (!given && !received) {
            throw new SecurityException("Access denied");
        }

        FeedbackHistoryDto summary = received && !given
                ? mapToReceivedHistoryDto(feedback, "RECEIVED", true)
                : mapToHistoryDto(feedback, "GIVEN");

        FeedbackDetailPageDto dto = new FeedbackDetailPageDto();
        dto.setId(summary.getId());
        dto.setDate(summary.getDate());
        dto.setDirection(summary.getDirection());
        dto.setEvaluatorName(summary.getEvaluatorName());
        dto.setEvaluatorStaffNo(summary.getEvaluatorStaffNo());
        dto.setEvaluatorPosition(summary.getEvaluatorPosition());
        dto.setEvaluatorDepartment(summary.getEvaluatorDepartment());
        dto.setEvaluateeName(summary.getEvaluateeName());
        dto.setEvaluateeStaffNo(summary.getEvaluateeStaffNo());
        dto.setEvaluateePosition(summary.getEvaluateePosition());
        dto.setEvaluateeDepartment(summary.getEvaluateeDepartment());
        dto.setPosition(summary.getPosition());
        dto.setRole(summary.getRole());
        dto.setScore(summary.getScore());
        dto.setRemark(summary.getRemark());
        dto.setAnonymous(summary.getAnonymous());
        dto.setAdditionalComments(summary.getAdditionalComments());
        dto.setStatus(summary.getStatus());
        dto.setReviewCycleId(summary.getReviewCycleId());
        dto.setReviewCycleName(summary.getReviewCycleName());
        dto.setReviewCycleStartDate(summary.getReviewCycleStartDate());
        dto.setDetails(mapFeedbackDetails(feedback));
        return dto;
    }

    private Feedback getFeedbackForChat(Long feedbackId, Long currentEmployeeId) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Feedback not found"));
        boolean participant = (feedback.getEvaluator() != null && currentEmployeeId.equals(feedback.getEvaluator().getId()))
                || (feedback.getEvaluatee() != null && currentEmployeeId.equals(feedback.getEvaluatee().getId()));
        if (!participant) {
            throw new SecurityException("Access denied");
        }
        return feedback;
    }

    private FeedbackChatMessageDto mapFeedbackChatMessage(FeedbackChatMessage message) {
        Employee author = message.getAuthor();
        Feedback feedback = message.getFeedback();
        // Determine the display name for the author.
        // If the feedback is anonymous and the message was written by the evaluator,
        // show "Anonymous" to protect the evaluator's identity.
        boolean authorIsEvaluator = author != null
                && feedback.getEvaluator() != null
                && author.getId().equals(feedback.getEvaluator().getId());
        String authorDisplayName;
        if (Boolean.TRUE.equals(feedback.getAnonymous()) && authorIsEvaluator) {
            authorDisplayName = "Anonymous";
        } else {
            authorDisplayName = author != null ? author.getEmployeeName() : "Unknown";
        }
        return new FeedbackChatMessageDto(
                message.getId(),
                feedback.getId(),
                author != null ? author.getId() : null,
                authorDisplayName,
                message.getContent(),
                message.getCreatedDate());
    }

    @Transactional(readOnly = true)
    public FeedbackDetailPageDto getAuditFeedbackDetailPage(Long feedbackId) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Feedback not found"));

        FeedbackHistoryDto summary = mapToHistoryDto(feedback, "RECEIVED");

        FeedbackDetailPageDto dto = new FeedbackDetailPageDto();
        dto.setId(summary.getId());
        dto.setDate(summary.getDate());
        dto.setDirection(summary.getDirection());
        dto.setEvaluatorName(summary.getEvaluatorName());
        dto.setEvaluatorStaffNo(summary.getEvaluatorStaffNo());
        dto.setEvaluatorPosition(summary.getEvaluatorPosition());
        dto.setEvaluatorDepartment(summary.getEvaluatorDepartment());
        dto.setEvaluateeName(summary.getEvaluateeName());
        dto.setEvaluateeStaffNo(summary.getEvaluateeStaffNo());
        dto.setEvaluateePosition(summary.getEvaluateePosition());
        dto.setEvaluateeDepartment(summary.getEvaluateeDepartment());
        dto.setPosition(summary.getPosition());
        dto.setRole(summary.getRole());
        dto.setScore(summary.getScore());
        dto.setRemark(summary.getRemark());
        dto.setAnonymous(summary.getAnonymous());
        dto.setAdditionalComments(summary.getAdditionalComments());
        dto.setStatus(summary.getStatus());
        dto.setReviewCycleId(summary.getReviewCycleId());
        dto.setReviewCycleName(summary.getReviewCycleName());
        dto.setReviewCycleStartDate(summary.getReviewCycleStartDate());
        dto.setDetails(mapFeedbackDetails(feedback));
        return dto;
    }

    private List<com.epms.backend.dto.FeedbackDetailDto> mapFeedbackDetails(Feedback feedback) {
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

        if ("SELF".equalsIgnoreCase(role)) {
            return isProbationEmployee(evaluator) ? new ArrayList<>() : List.of(evaluator);
        }

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
        dto.setEvaluateeLevelCode(draft.getEvaluatee().getPosition() != null && draft.getEvaluatee().getPosition().getLevelCode() != null
                ? draft.getEvaluatee().getPosition().getLevelCode().getCode()
                : null);
        dto.setEvaluateePosition(draft.getEvaluatee().getPosition() != null ? draft.getEvaluatee().getPosition().getName() : "N/A");
        dto.setEvaluateeDepartment(draft.getEvaluatee().getDepartment() != null ? draft.getEvaluatee().getDepartment().getName() : "N/A");
        dto.setRole(draft.getRole());
        dto.setAnonymous(Boolean.TRUE.equals(draft.getAnonymous()));
        dto.setAdditionalComments(draft.getAdditionalComments());
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

    private FeedbackAuditSummaryRowDto buildAuditSummaryRow(Employee evaluatee, List<Feedback> feedbacks, FeedbackAuditHistoryFilter filter) {
        long feedbackCount = feedbacks.size();
        long anonymousCount = feedbacks.stream().filter(f -> Boolean.TRUE.equals(f.getAnonymous())).count();
        double scoreSum = feedbacks.stream().map(Feedback::getScore).filter(score -> score != null).mapToDouble(Double::doubleValue).sum();
        long scoreCount = feedbacks.stream().map(Feedback::getScore).filter(score -> score != null).count();
        Instant latest = feedbacks.stream()
                .map(Feedback::getCreatedDate)
                .filter(date -> date != null)
                .max(Instant::compareTo)
                .orElse(null);
        ReviewCycle filteredCycle = filter != null && filter.getReviewCycleId() != null
                ? reviewCycleRepository.findById(filter.getReviewCycleId()).orElse(null)
                : null;
        return new FeedbackAuditSummaryRowDto(
                evaluatee != null ? evaluatee.getId() : null,
                evaluatee != null ? evaluatee.getEmployeeName() : null,
                evaluatee != null ? evaluatee.getEmployeeId() : null,
                employeePositionName(evaluatee),
                employeeDepartmentName(evaluatee),
                feedbackCount,
                anonymousCount,
                feedbackCount - anonymousCount,
                scoreCount > 0 ? scoreSum / scoreCount : 0d,
                latest,
                filteredCycle != null ? filteredCycle.getId() : null,
                filteredCycle != null ? filteredCycle.getName() : null);
    }

    private Specification<Feedback> auditHistorySpec(FeedbackAuditHistoryFilter filter) {
        ReviewCycle filterCycle = filter != null && filter.getReviewCycleId() != null
                ? reviewCycleRepository.findById(filter.getReviewCycleId()).orElse(null)
                : null;
        return (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            if (filter != null) {
                applyAuditHistoryFilters(filter, filterCycle, root, cb, predicates);
            }
            query.orderBy(cb.desc(root.get("createdDate")));
            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }

    private void applyAuditHistoryFilters(
            FeedbackAuditHistoryFilter filter,
            ReviewCycle filterCycle,
            jakarta.persistence.criteria.Root<Feedback> root,
            jakarta.persistence.criteria.CriteriaBuilder cb,
            List<jakarta.persistence.criteria.Predicate> predicates) {
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
        if (hasText(filter.getFeedbackType())) {
            predicates.add(cb.equal(cb.upper(root.get("role")), filter.getFeedbackType().toUpperCase(Locale.ROOT)));
        }
        if (hasText(filter.getSearch())) {
            String value = like(filter.getSearch());
            predicates.add(cb.or(
                    cb.like(cb.lower(root.get("evaluatee").get("employeeName")), value),
                    cb.like(cb.lower(root.get("evaluatee").get("employeeId")), value)));
        }
        if (hasText(filter.getDepartment())) {
            String department = filter.getDepartment().trim();
            String value = like(department);
            predicates.add(cb.or(
                    cb.like(cb.lower(root.get("evaluatee").get("department").get("name")), value),
                    cb.equal(root.get("evaluatee").get("department").get("id").as(String.class), department)));
        }
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

    private String normalizeAdditionalComments(String value) {
        if (!hasText(value)) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.length() > ADDITIONAL_COMMENTS_MAX_LENGTH) {
            throw new RuntimeException("Additional comments must be 1000 characters or fewer");
        }
        return trimmed;
    }

    private Specification<Feedback> combinedHistorySpec(Long employeeId, FeedbackHistoryFilter filter) {
        ReviewCycle filterCycle = filter != null && filter.getReviewCycleId() != null
                ? reviewCycleRepository.findById(filter.getReviewCycleId()).orElse(null)
                : null;
        return (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            jakarta.persistence.criteria.Predicate given = cb.equal(root.get("evaluator").get("id"), employeeId);
            jakarta.persistence.criteria.Predicate received = cb.equal(root.get("evaluatee").get("id"), employeeId);

            if (filter != null && hasText(filter.getDirection())) {
                if ("GIVEN".equalsIgnoreCase(filter.getDirection())) {
                    predicates.add(given);
                } else if ("RECEIVED".equalsIgnoreCase(filter.getDirection())) {
                    predicates.add(received);
                } else {
                    predicates.add(cb.or(given, received));
                }
            } else {
                predicates.add(cb.or(given, received));
            }

            if (filter != null) {
                applySharedHistoryFilters(filter, filterCycle, root, cb, predicates);
                if (hasText(filter.getPeopleSearch())) {
                    String value = like(filter.getPeopleSearch());
                    predicates.add(cb.or(
                            cb.like(cb.lower(root.get("evaluator").get("employeeName")), value),
                            cb.like(cb.lower(root.get("evaluator").get("employeeId")), value),
                            cb.like(cb.lower(root.get("evaluatee").get("employeeName")), value),
                            cb.like(cb.lower(root.get("evaluatee").get("employeeId")), value)));
                }
            }

            query.orderBy(cb.desc(root.get("createdDate")));
            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }

    private void applySharedHistoryFilters(
            FeedbackHistoryFilter filter,
            ReviewCycle filterCycle,
            jakarta.persistence.criteria.Root<Feedback> root,
            jakarta.persistence.criteria.CriteriaBuilder cb,
            List<jakarta.persistence.criteria.Predicate> predicates) {
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
        if (hasText(filter.getFeedbackType())) {
            predicates.add(cb.equal(cb.upper(root.get("role")), filter.getFeedbackType().toUpperCase(Locale.ROOT)));
        }
    }

    private void recordFeedbackSubmittedAudit(Feedback feedback) {
        Employee evaluator = feedback.getEvaluator();

        User evaluatorUser = evaluator != null
                ? userRepository.findByEmployee_Id(evaluator.getId()).orElse(null)
                : null;
        Long performedByUserId = evaluatorUser != null ? evaluatorUser.getId() : null;
        Long performedByRoleId = evaluatorUser != null && evaluatorUser.getRole() != null
                ? evaluatorUser.getRole().getId()
                : null;

        auditService.record(
                AuditActionType.FEEDBACK_360_SUBMITTED,
                AuditTargetType.FEEDBACK_360,
                feedback.getId(),
                performedByUserId,
                performedByRoleId,
                feedbackSubmittedDescription(feedback),
                feedbackSubmittedMetadataJson(feedback));
    }

    private String feedbackSubmittedDescription(Feedback feedback) {
        ReviewCycle reviewCycle = feedback.getReviewCycle();
        String description = "Submitted 360 feedback from "
                + employeeName(feedback.getEvaluator())
                + " to "
                + employeeName(feedback.getEvaluatee())
                + " as "
                + valueOrUnknown(feedback.getRole());
        if (reviewCycle != null) {
            description += " for review cycle "
                    + valueOrUnknown(reviewCycle.getName())
                    + " (id "
                    + valueOrUnknown(reviewCycle.getId())
                    + ")";
        }
        return description;
    }

    private String feedbackSubmittedMetadataJson(Feedback feedback) {
        ReviewCycle reviewCycle = feedback.getReviewCycle();
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("feedbackId", feedback.getId());
        metadata.put("evaluatorEmployeeId", employeeId(feedback.getEvaluator()));
        metadata.put("evaluatorName", employeeName(feedback.getEvaluator()));
        metadata.put("evaluateeEmployeeId", employeeId(feedback.getEvaluatee()));
        metadata.put("evaluateeName", employeeName(feedback.getEvaluatee()));
        metadata.put("role", feedback.getRole());
        metadata.put("anonymous", Boolean.TRUE.equals(feedback.getAnonymous()));
        metadata.put("score", feedback.getScore());
        metadata.put("remark", feedback.getRemark());
        metadata.put("reviewCycleId", reviewCycle != null ? reviewCycle.getId() : null);
        metadata.put("reviewCycleName", reviewCycle != null ? reviewCycle.getName() : null);
        try {
            return OBJECT_MAPPER.writeValueAsString(metadata);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Failed to serialize 360 feedback audit metadata", ex);
        }
    }

    private Long employeeId(Employee employee) {
        return employee != null ? employee.getId() : null;
    }

    private String employeeName(Employee employee) {
        return employee != null ? employee.getEmployeeName() : null;
    }

    private String valueOrUnknown(Object value) {
        return value != null && !String.valueOf(value).isBlank() ? String.valueOf(value) : "unknown";
    }

    private String like(String value) {
        return "%" + value.trim().toLowerCase(Locale.ROOT) + "%";
    }

}
