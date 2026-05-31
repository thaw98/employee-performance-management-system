package com.epms.backend.service;

import com.epms.backend.dto.selfassessmentform.HrRejectManagerReviewRequest;
import com.epms.backend.dto.selfassessmentform.SelfAssessmentFormDto;
import com.epms.backend.entity.*;
import com.epms.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SelfAssessmentFormHrRejectArchiveTest {

    @Mock
    private SelfAssessmentFormTemplateRepository templateRepository;
    @Mock
    private CopiedSelfAssessmentFormTemplateRepository copiedTemplateRepository;
    @Mock
    private SelfAssessmentFormRepository formRepository;
    @Mock
    private SelfAssessmentFormAdjustmentRepository adjustmentRepository;
    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private DepartmentRepository departmentRepository;
    @Mock
    private PositionRepository positionRepository;
    @Mock
    private SignatureRepository signatureRepository;
    @Mock
    private ReviewCycleService reviewCycleService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private AuditService auditService;
    @Mock
    private AuditLogRepository auditLogRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private SelfAssessmentSettingsRepository settingsRepository;
    @Mock
    private ReportingManagerResolver reportingManagerResolver;
    @Mock
    private SelfAssessmentUnlockRequestRepository unlockRequestRepository;
    @Mock
    private SelfAssessmentArchiveSnapshotRepository archiveSnapshotRepository;
    @Mock
    private ScoreExplanationRepository scoreExplanationRepository;

    private SelfAssessmentFormService service;

    private User hrUser(Long id) {
        User user = new User();
        user.setId(id);
        Employee emp = new Employee();
        emp.setId(500L + id);
        emp.setEmployeeName("HR Admin " + id);
        user.setEmployee(emp);
        return user;
    }

    @BeforeEach
    void setUp() {
        service = new SelfAssessmentFormService(
                templateRepository,
                copiedTemplateRepository,
                formRepository,
                adjustmentRepository,
                employeeRepository,
                departmentRepository,
                positionRepository,
                signatureRepository,
                reviewCycleService,
                notificationService,
                auditService,
                auditLogRepository,
                userRepository,
                notificationRepository,
                settingsRepository,
                reportingManagerResolver,
                unlockRequestRepository,
                archiveSnapshotRepository,
                scoreExplanationRepository);
    }

    @Test
    void hrRejectManagerReview_createsArchiveSnapshotBeforeReset() {
        Long formId = 10L;
        Long hrUserId = 1L;
        LocalDate retakeDeadline = LocalDate.of(2026, 6, 15);

        Employee employee = new Employee();
        employee.setId(100L);
        employee.setEmployeeName("John Doe");
        employee.setEmployeeId("STF001");

        Department dept = new Department();
        dept.setId(10L);
        dept.setName("Engineering");
        employee.setDepartment(dept);

        Position pos = new Position();
        pos.setId(20L);
        pos.setName("Developer");
        employee.setPosition(pos);

        SelfAssessmentFormTemplate template = new SelfAssessmentFormTemplate();
        template.setId(50L);
        template.setTitle("Q1 Review Template");

        ReviewCycle cycle = new ReviewCycle();
        cycle.setId(5L);
        cycle.setName("Cycle 1");

        SelfAssessmentForm form = new SelfAssessmentForm();
        form.setId(formId);
        form.setEmployee(employee);
        form.setTemplate(template);
        form.setCycle(cycle);
        form.setStatus(SelfAssessmentFormStatus.PENDING_FINAL_APPROVAL);
        form.setTotalScore(75.0);
        form.setManagerRevisedTotalScore(80.0);
        form.setDeadlineDate(LocalDate.of(2026, 5, 30));

        SelfAssessmentFormAnswer answer = new SelfAssessmentFormAnswer();
        answer.setId(100L);
        answer.setQuestionText("Test question");
        answer.setSortOrder(1);
        answer.setYesNoAnswer("Yes");
        answer.setRating(4);
        answer.setManagerProposedYesNo("Yes");
        answer.setManagerProposedRating(4);
        answer.setManagerProposedComment("Good");
        form.setAnswers(List.of(answer));

        User hrUser = hrUser(hrUserId);

        Signature sig = new Signature();
        sig.setId(99L);

        when(formRepository.findById(formId)).thenReturn(Optional.of(form));
        when(userRepository.findByIdWithEmployeeDepartment(hrUserId)).thenReturn(Optional.of(hrUser));
        when(signatureRepository.findByUserAndIsDefaultTrue(hrUser)).thenReturn(Optional.of(sig));
        when(archiveSnapshotRepository.save(any(SelfAssessmentArchiveSnapshot.class)))
                .thenAnswer(invocation -> {
                    SelfAssessmentArchiveSnapshot snapshot = invocation.getArgument(0);
                    snapshot.setId(1L);
                    return snapshot;
                });
        when(formRepository.save(any(SelfAssessmentForm.class))).thenAnswer(invocation -> invocation.getArgument(0));

        HrRejectManagerReviewRequest request = new HrRejectManagerReviewRequest(
                "Needs complete redo",
                retakeDeadline,
                null);

        service.hrRejectManagerReview(formId, request, hrUserId);

        ArgumentCaptor<SelfAssessmentArchiveSnapshot> snapshotCaptor =
                ArgumentCaptor.forClass(SelfAssessmentArchiveSnapshot.class);
        verify(archiveSnapshotRepository).save(snapshotCaptor.capture());

        SelfAssessmentArchiveSnapshot savedSnapshot = snapshotCaptor.getValue();
        assertEquals(formId, savedSnapshot.getOriginalFormId());
        assertEquals(employee, savedSnapshot.getEmployee());
        assertEquals("John Doe", savedSnapshot.getEmployeeName());
        assertEquals("STF001", savedSnapshot.getEmployeeStaffNo());
        assertEquals("Engineering", savedSnapshot.getDepartmentName());
        assertEquals("Developer", savedSnapshot.getPositionName());
        assertEquals("Q1 Review Template", savedSnapshot.getTemplateTitle());
        assertEquals("Cycle 1", savedSnapshot.getCycleName());
        assertEquals(SelfAssessmentFormStatus.PENDING_FINAL_APPROVAL, savedSnapshot.getArchivedStatus());
        assertEquals("Needs complete redo", savedSnapshot.getRejectionReason());
        assertEquals(hrUserId, savedSnapshot.getHrUserId());
        assertEquals(retakeDeadline, savedSnapshot.getRetakeDeadline());
        assertNotNull(savedSnapshot.getArchivedAt());
        assertNotNull(savedSnapshot.getFormSnapshot());
    }

    @Test
    void hrRejectManagerReview_resetsFormToDraftAndClearsFields() {
        Long formId = 10L;
        Long hrUserId = 1L;
        LocalDate retakeDeadline = LocalDate.of(2026, 6, 15);

        Employee employee = new Employee();
        employee.setId(100L);
        employee.setEmployeeName("John Doe");

        SelfAssessmentForm form = new SelfAssessmentForm();
        form.setId(formId);
        form.setEmployee(employee);
        form.setStatus(SelfAssessmentFormStatus.PENDING_FINAL_APPROVAL);
        form.setTotalScore(75.0);
        form.setManagerRevisedTotalScore(80.0);
        form.setFinalApprovedTotalScore(85.0);
        form.setSubmittedDate(Instant.now());
        form.setAssessmentDate(LocalDate.now());
        form.setEmployeeRemarks("Some remarks");
        form.setOverallRemarks("Overall");
        form.setEmployeeSignatureId(50L);
        form.setEmployeeSignatureDate(Instant.now());
        form.setManagerComments("Manager comments");
        form.setManagerSignatureId(60L);
        form.setManagerSignatureDate(Instant.now());
        form.setEmployeeAcknowledgedAt(Instant.now());
        form.setEmployeeDisputedAt(Instant.now());
        form.setEmployeeDisputeReason("Dispute reason");

        SelfAssessmentFormTemplate template = new SelfAssessmentFormTemplate();
        template.setId(50L);
        template.setTitle("Q1 Review Template");
        form.setTemplate(template);

        SelfAssessmentFormAnswer answer = new SelfAssessmentFormAnswer();
        answer.setId(100L);
        answer.setYesNoAnswer("Yes");
        answer.setRating(4);
        answer.setRemarks("Answer remarks");
        answer.setManagerProposedYesNo("Yes");
        answer.setManagerProposedRating(4);
        answer.setManagerProposedComment("Manager comment");
        answer.setHrAdjustmentApproved(true);
        answer.setFinalApprovedYesNo("Yes");
        answer.setFinalApprovedRating(4);
        form.setAnswers(List.of(answer));

        User hrUser = hrUser(hrUserId);

        Signature sig = new Signature();
        sig.setId(99L);

        when(formRepository.findById(formId)).thenReturn(Optional.of(form));
        when(userRepository.findByIdWithEmployeeDepartment(hrUserId)).thenReturn(Optional.of(hrUser));
        when(signatureRepository.findByUserAndIsDefaultTrue(hrUser)).thenReturn(Optional.of(sig));
        when(archiveSnapshotRepository.save(any())).thenAnswer(invocation -> {
            SelfAssessmentArchiveSnapshot snapshot = invocation.getArgument(0);
            snapshot.setId(1L);
            return snapshot;
        });
        when(formRepository.save(any(SelfAssessmentForm.class))).thenAnswer(invocation -> invocation.getArgument(0));

        HrRejectManagerReviewRequest request = new HrRejectManagerReviewRequest(
                "Needs complete redo",
                retakeDeadline,
                null);

        SelfAssessmentFormDto result = service.hrRejectManagerReview(formId, request, hrUserId);

        assertEquals(SelfAssessmentFormStatus.DRAFT.name(), result.status());
        assertEquals(retakeDeadline, result.deadlineDate());

        ArgumentCaptor<SelfAssessmentForm> formCaptor = ArgumentCaptor.forClass(SelfAssessmentForm.class);
        verify(formRepository).save(formCaptor.capture());
        SelfAssessmentForm savedForm = formCaptor.getValue();

        assertNull(savedForm.getSubmittedDate());
        assertNull(savedForm.getAssessmentDate());
        assertNull(savedForm.getEmployeeRemarks());
        assertNull(savedForm.getOverallRemarks());
        assertNull(savedForm.getEmployeeSignatureId());
        assertNull(savedForm.getEmployeeSignatureDate());
        assertNull(savedForm.getManagerComments());
        assertNull(savedForm.getManagerSignatureId());
        assertNull(savedForm.getManagerSignatureDate());
        assertNull(savedForm.getManagerRevisedTotalScore());
        assertNull(savedForm.getTotalScore());
        assertNull(savedForm.getRatingCategory());
        assertNull(savedForm.getFinalApprovedTotalScore());
        assertNull(savedForm.getEmployeeAcknowledgedAt());
        assertNull(savedForm.getEmployeeDisputedAt());
        assertNull(savedForm.getEmployeeDisputeReason());

        assertEquals(retakeDeadline, savedForm.getDeadlineDate());
        assertEquals(SelfAssessmentFormStatus.DRAFT, savedForm.getStatus());

        SelfAssessmentFormAnswer savedAnswer = savedForm.getAnswers().get(0);
        assertNull(savedAnswer.getYesNoAnswer());
        assertNull(savedAnswer.getRating());
        assertNull(savedAnswer.getRemarks());
        assertNull(savedAnswer.getManagerProposedYesNo());
        assertNull(savedAnswer.getManagerProposedRating());
        assertNull(savedAnswer.getManagerProposedComment());
        assertNull(savedAnswer.getHrAdjustmentApproved());
        assertNull(savedAnswer.getFinalApprovedYesNo());
        assertNull(savedAnswer.getFinalApprovedRating());

        assertEquals(employee, savedForm.getEmployee());
        assertNotNull(savedForm.getTemplate());
    }

    @Test
    void hrRejectManagerReview_throwsWhenRetakeDeadlineIsNull() {
        Long formId = 10L;
        Long hrUserId = 1L;

        Employee employee = new Employee();
        employee.setId(100L);

        SelfAssessmentForm form = new SelfAssessmentForm();
        form.setId(formId);
        form.setEmployee(employee);
        form.setStatus(SelfAssessmentFormStatus.PENDING_FINAL_APPROVAL);

        when(formRepository.findById(formId)).thenReturn(Optional.of(form));

        HrRejectManagerReviewRequest request = new HrRejectManagerReviewRequest(
                "Reason",
                null,
                null);

        assertThrows(RuntimeException.class, () ->
                service.hrRejectManagerReview(formId, request, hrUserId));
    }

    @Test
    void hrRejectManagerReview_throwsWhenFormStatusIsDRAFT() {
        Long formId = 10L;
        Long hrUserId = 1L;

        Employee employee = new Employee();
        employee.setId(100L);

        SelfAssessmentForm form = new SelfAssessmentForm();
        form.setId(formId);
        form.setEmployee(employee);
        form.setStatus(SelfAssessmentFormStatus.DRAFT);

        when(formRepository.findById(formId)).thenReturn(Optional.of(form));

        HrRejectManagerReviewRequest request = new HrRejectManagerReviewRequest(
                "Reason",
                LocalDate.of(2026, 6, 15),
                null);

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                service.hrRejectManagerReview(formId, request, hrUserId));
        assertTrue(ex.getMessage().contains("pending final approval"));
    }

    @Test
    void hrRejectManagerReview_sendsNotificationToEmployee() {
        Long formId = 10L;
        Long hrUserId = 1L;
        LocalDate retakeDeadline = LocalDate.of(2026, 6, 15);

        Employee employee = new Employee();
        employee.setId(100L);
        employee.setEmployeeName("John Doe");

        User employeeUser = new User();
        employeeUser.setId(200L);
        employeeUser.setActive(true);
        employee.setUserAccount(employeeUser);

        SelfAssessmentFormTemplate template = new SelfAssessmentFormTemplate();
        template.setId(50L);
        template.setTitle("Q1 Review Template");

        SelfAssessmentForm form = new SelfAssessmentForm();
        form.setId(formId);
        form.setEmployee(employee);
        form.setTemplate(template);
        form.setStatus(SelfAssessmentFormStatus.PENDING_FINAL_APPROVAL);
        form.setDeadlineDate(LocalDate.of(2026, 5, 30));

        User hrUser = hrUser(hrUserId);

        Signature sig = new Signature();
        sig.setId(99L);

        when(formRepository.findById(formId)).thenReturn(Optional.of(form));
        when(userRepository.findByIdWithEmployeeDepartment(hrUserId)).thenReturn(Optional.of(hrUser));
        when(signatureRepository.findByUserAndIsDefaultTrue(hrUser)).thenReturn(Optional.of(sig));
        when(archiveSnapshotRepository.save(any())).thenAnswer(invocation -> {
            SelfAssessmentArchiveSnapshot snapshot = invocation.getArgument(0);
            snapshot.setId(1L);
            return snapshot;
        });
        when(formRepository.save(any(SelfAssessmentForm.class))).thenAnswer(invocation -> invocation.getArgument(0));

        HrRejectManagerReviewRequest request = new HrRejectManagerReviewRequest(
                "Needs complete redo",
                retakeDeadline,
                null);

        service.hrRejectManagerReview(formId, request, hrUserId);

        verify(notificationService).send(
                eq(employeeUser),
                eq("Self-Assessment Rejected - Full Retake Required"),
                contains("rejected"),
                eq("SELF_ASSESSMENT_FORM"),
                eq(formId));
    }

    @Test
    void hrRejectManagerReview_throwsWhenStatusIsNotPendingFinalApproval() {
        Long formId = 10L;
        Long hrUserId = 1L;

        SelfAssessmentForm form = new SelfAssessmentForm();
        form.setId(formId);
        form.setStatus(SelfAssessmentFormStatus.PENDING_HR_CALIBRATION_REVIEW);

        when(formRepository.findById(formId)).thenReturn(Optional.of(form));

        HrRejectManagerReviewRequest request = new HrRejectManagerReviewRequest(
                "Reason",
                LocalDate.of(2026, 6, 15),
                null);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> service.hrRejectManagerReview(formId, request, hrUserId));
        assertTrue(ex.getMessage().contains("pending final approval"));
    }

    @Test
    void hrRejectManagerReview_eligibleOnlyWhenPendingFinalApproval() {
        for (SelfAssessmentFormStatus status : List.of(
                SelfAssessmentFormStatus.MANAGER_REVIEWED,
                SelfAssessmentFormStatus.PENDING_HR_CALIBRATION_REVIEW,
                SelfAssessmentFormStatus.PENDING_EMPLOYEE_REVIEW)) {

            Long formId = 10L + status.ordinal();
            Long hrUserId = 1L;

            SelfAssessmentForm form = new SelfAssessmentForm();
            form.setId(formId);
            form.setStatus(status);

            when(formRepository.findById(formId)).thenReturn(Optional.of(form));

            HrRejectManagerReviewRequest request = new HrRejectManagerReviewRequest(
                    "Reason",
                    LocalDate.of(2026, 6, 15),
                    null);

            assertThrows(RuntimeException.class,
                    () -> service.hrRejectManagerReview(formId, request, hrUserId));

            reset(formRepository);
        }

        SelfAssessmentFormStatus status = SelfAssessmentFormStatus.PENDING_FINAL_APPROVAL;
        Long formId = 10L + status.ordinal();
        Long hrUserId = 1L;

        Employee employee = new Employee();
        employee.setId(100L);

        SelfAssessmentForm form = new SelfAssessmentForm();
        form.setId(formId);
        form.setEmployee(employee);
        form.setStatus(status);

        SelfAssessmentFormTemplate template = new SelfAssessmentFormTemplate();
        template.setId(50L);
        template.setTitle("Q1 Review Template");
        form.setTemplate(template);

        User hrUser = hrUser(hrUserId);

        Signature sig = new Signature();
        sig.setId(99L);

        when(formRepository.findById(formId)).thenReturn(Optional.of(form));
        when(userRepository.findByIdWithEmployeeDepartment(hrUserId)).thenReturn(Optional.of(hrUser));
        when(signatureRepository.findByUserAndIsDefaultTrue(hrUser)).thenReturn(Optional.of(sig));
        when(archiveSnapshotRepository.save(any())).thenAnswer(invocation -> {
            SelfAssessmentArchiveSnapshot snapshot = invocation.getArgument(0);
            snapshot.setId(1L);
            return snapshot;
        });
        when(formRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        HrRejectManagerReviewRequest request = new HrRejectManagerReviewRequest(
                "Reason",
                LocalDate.of(2026, 6, 15),
                null);

        assertDoesNotThrow(() -> service.hrRejectManagerReview(formId, request, hrUserId));
    }
}
