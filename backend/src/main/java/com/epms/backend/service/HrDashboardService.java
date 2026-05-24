package com.epms.backend.service;

import com.epms.backend.dto.hr.HrDashboardSummaryDto;
import com.epms.backend.entity.AppraisalStatus;
import com.epms.backend.entity.EmployeeStatus;
import com.epms.backend.entity.MeetingStatus;
import com.epms.backend.entity.ReviewCycle;
import com.epms.backend.entity.SelfAssessmentFormStatus;
import com.epms.backend.repository.AppraisalAssignmentRepository;
import com.epms.backend.repository.DepartmentRepository;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.MeetingRepository;
import com.epms.backend.repository.PipRepository;
import com.epms.backend.repository.SelfAssessmentFormRepository;
import com.epms.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class HrDashboardService {
    private static final List<AppraisalStatus> COMPLETED_APPRAISAL_STATUSES = List.of(
            AppraisalStatus.SUBMITTED,
            AppraisalStatus.HR_APPROVED,
            AppraisalStatus.LOCKED
    );
    private static final List<AppraisalStatus> PENDING_APPRAISAL_STATUSES = List.of(
            AppraisalStatus.DRAFT,
            AppraisalStatus.PENDING_MANAGER,
            AppraisalStatus.RETURNED
    );
    private static final List<SelfAssessmentFormStatus> SUBMITTED_SELF_ASSESSMENT_STATUSES = List.of(
            SelfAssessmentFormStatus.SUBMITTED,
            SelfAssessmentFormStatus.MANAGER_REVIEWED,
            SelfAssessmentFormStatus.APPROVED,
            SelfAssessmentFormStatus.PENDING_MANAGER_REVIEW,
            SelfAssessmentFormStatus.PENDING_FINAL_APPROVAL,
            SelfAssessmentFormStatus.PENDING_HR_CALIBRATION_REVIEW,
            SelfAssessmentFormStatus.FINALIZED_LOCKED
    );
    private static final List<SelfAssessmentFormStatus> PENDING_SELF_ASSESSMENT_STATUSES = List.of(
            SelfAssessmentFormStatus.DRAFT,
            SelfAssessmentFormStatus.NOT_STARTED,
            SelfAssessmentFormStatus.NOT_SUBMITTED,
            SelfAssessmentFormStatus.REOPENED,
            SelfAssessmentFormStatus.PENDING_EMPLOYEE_REVIEW,
            SelfAssessmentFormStatus.PENDING_EMPLOYEE_RETAKE,
            SelfAssessmentFormStatus.PENDING_RETAKE_MANAGER_REVIEW
    );
    private static final List<String> ACTIVE_PIP_STATUSES = List.of("ACTIVE", "REOPEN_REQUESTED");
    private static final List<MeetingStatus> UPCOMING_MEETING_STATUSES = List.of(
            MeetingStatus.PENDING,
            MeetingStatus.ACCEPTED,
            MeetingStatus.RESCHEDULE_REQUESTED,
            MeetingStatus.RESCHEDULE_MGR,
            MeetingStatus.CANCEL_REQUESTED,
            MeetingStatus.ONGOING
    );

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final AppraisalAssignmentRepository appraisalAssignmentRepository;
    private final SelfAssessmentFormRepository selfAssessmentFormRepository;
    private final PipRepository pipRepository;
    private final MeetingRepository meetingRepository;
    private final ReviewCycleService reviewCycleService;

    public HrDashboardService(
            EmployeeRepository employeeRepository,
            DepartmentRepository departmentRepository,
            UserRepository userRepository,
            AppraisalAssignmentRepository appraisalAssignmentRepository,
            SelfAssessmentFormRepository selfAssessmentFormRepository,
            PipRepository pipRepository,
            MeetingRepository meetingRepository,
            ReviewCycleService reviewCycleService
    ) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
        this.appraisalAssignmentRepository = appraisalAssignmentRepository;
        this.selfAssessmentFormRepository = selfAssessmentFormRepository;
        this.pipRepository = pipRepository;
        this.meetingRepository = meetingRepository;
        this.reviewCycleService = reviewCycleService;
    }

    @Transactional(readOnly = true)
    public HrDashboardSummaryDto getSummary() {
        LocalDate today = LocalDate.now();
        Instant now = Instant.now();
        Instant weekEnd = now.plus(7, ChronoUnit.DAYS);

        long totalEmployees = employeeRepository.count();
        long activeEmployees = employeeRepository.countByEmploymentStatus(EmployeeStatus.ACTIVE);
        long departments = departmentRepository.count();
        long managers = userRepository.countByRole_IdAndActiveTrue(2L);
        long employeesInAppraisalCycle = appraisalAssignmentRepository.countEmployeesInActiveCycle();
        long activePips = pipRepository.countByStatusIn(ACTIVE_PIP_STATUSES);
        long pipsDueForReview = pipRepository.countByStatusInAndEndDateLessThanEqual(ACTIVE_PIP_STATUSES, today);
        long upcomingMeetings = meetingRepository.countByScheduledTimeAfterAndStatusIn(now, UPCOMING_MEETING_STATUSES);
        long upcomingMeetingsThisWeek = meetingRepository.countByScheduledTimeBetweenAndStatusIn(now, weekEnd, UPCOMING_MEETING_STATUSES);

        long selfTotal = 0;
        long selfSubmitted = 0;
        long selfPending = 0;
        long selfOverdue = 0;
        ReviewCycle activeSubmissionCycle = reviewCycleService.getActiveSubmissionCycle();
        if (activeSubmissionCycle != null) {
            selfTotal = selfAssessmentFormRepository.countByCycle(activeSubmissionCycle);
            selfSubmitted = selfAssessmentFormRepository.countByCycleAndStatusIn(activeSubmissionCycle, SUBMITTED_SELF_ASSESSMENT_STATUSES);
            selfPending = selfAssessmentFormRepository.countByCycleAndStatusIn(activeSubmissionCycle, PENDING_SELF_ASSESSMENT_STATUSES);
            selfOverdue = selfAssessmentFormRepository.countByCycleAndStatusInAndDeadlineDateBefore(
                    activeSubmissionCycle,
                    PENDING_SELF_ASSESSMENT_STATUSES,
                    today
            );
        }

        long appraisalTotal = appraisalAssignmentRepository.countActiveCycleAssignments();
        long completedAppraisals = appraisalAssignmentRepository.countActiveCycleAssignmentsByStatusIn(COMPLETED_APPRAISAL_STATUSES);
        long pendingAppraisals = appraisalAssignmentRepository.countActiveCycleAssignmentsByStatusIn(PENDING_APPRAISAL_STATUSES);
        long overdueAppraisals = appraisalAssignmentRepository.countOverdueActiveCycleAssignments(PENDING_APPRAISAL_STATUSES, today);

        HrDashboardSummaryDto.Overview overview = new HrDashboardSummaryDto.Overview(
                totalEmployees,
                activeEmployees,
                departments,
                managers,
                employeesInAppraisalCycle,
                selfPending,
                activePips,
                upcomingMeetings
        );

        HrDashboardSummaryDto.Visuals visuals = new HrDashboardSummaryDto.Visuals(
                employeeRepository.countActiveEmployeesByDepartment().stream()
                        .map(row -> new HrDashboardSummaryDto.NameValue(String.valueOf(row[0]), ((Number) row[1]).longValue()))
                        .toList(),
                new HrDashboardSummaryDto.Progress(
                        appraisalTotal,
                        completedAppraisals,
                        pendingAppraisals,
                        overdueAppraisals,
                        percentage(completedAppraisals, appraisalTotal)
                ),
                new HrDashboardSummaryDto.StatusBreakdown(
                        selfTotal,
                        selfSubmitted,
                        selfPending,
                        selfOverdue,
                        percentage(selfSubmitted, selfTotal)
                ),
                pipRepository.countByStatusGroup().stream()
                        .map(row -> new HrDashboardSummaryDto.NameValue(String.valueOf(row[0]), ((Number) row[1]).longValue()))
                        .toList(),
                upcomingMeetingsThisWeek
        );

        List<HrDashboardSummaryDto.AttentionItem> needsAttention = List.of(
                new HrDashboardSummaryDto.AttentionItem("Pending self-assessments", selfPending, "/hr/self-assessment/forms", "warning"),
                new HrDashboardSummaryDto.AttentionItem("Overdue appraisals", overdueAppraisals, "/hr/appraisals/submissions", "danger"),
                new HrDashboardSummaryDto.AttentionItem("PIPs due for review", pipsDueForReview, "/hr/pip-monitoring", "danger"),
                new HrDashboardSummaryDto.AttentionItem("Meetings happening soon", upcomingMeetingsThisWeek, "/hr/meetings", "info")
        ).stream().filter(item -> item.value() > 0).toList();

        return new HrDashboardSummaryDto(overview, visuals, needsAttention);
    }

    private int percentage(long completed, long total) {
        if (total <= 0) {
            return 0;
        }
        return (int) Math.round((completed * 100.0) / total);
    }
}
