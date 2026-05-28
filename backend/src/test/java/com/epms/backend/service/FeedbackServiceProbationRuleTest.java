package com.epms.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.epms.backend.StaffTypes;
import com.epms.backend.audit.AuditActionType;
import com.epms.backend.audit.AuditTargetType;
import com.epms.backend.dto.FeedbackSubmissionRequest;
import com.epms.backend.dto.TimeSettingDto;
import com.epms.backend.entity.Criteria;
import com.epms.backend.entity.Department;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.Feedback;
import com.epms.backend.entity.FeedbackDraft;
import com.epms.backend.entity.ReviewCycle;
import com.epms.backend.entity.Role;
import com.epms.backend.entity.StaffType;
import com.epms.backend.entity.User;
import com.epms.backend.repository.CriteriaRepository;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.FeedbackDraftRepository;
import com.epms.backend.repository.FeedbackRepository;
import com.epms.backend.repository.ReviewCycleRepository;
import com.epms.backend.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class FeedbackServiceProbationRuleTest {

    @Mock
    private FeedbackRepository feedbackRepository;
    @Mock
    private FeedbackDraftRepository feedbackDraftRepository;
    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private ReportingManagerResolver reportingManagerResolver;
    @Mock
    private CriteriaRepository criteriaRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private TimeSettingService timeSettingService;
    @Mock
    private ReviewCycleService reviewCycleService;
    @Mock
    private ReviewCycleRepository reviewCycleRepository;
    @Mock
    private AuditService auditService;

    private FeedbackService feedbackService;

    @BeforeEach
    void setUp() {
        feedbackService = new FeedbackService(
                feedbackRepository,
                feedbackDraftRepository,
                employeeRepository,
                reportingManagerResolver,
                criteriaRepository,
                userRepository,
                notificationService,
                timeSettingService,
                reviewCycleService,
                reviewCycleRepository,
                auditService);
    }

    @Test
    void getEligibleEvaluatees_excludesProbationEmployees() {
        Employee evaluator = new Employee();
        evaluator.setId(10L);
        evaluator.setDepartment(newDepartment(1L));
        evaluator.setPosition(TestFixtures.newPositionWithLevel(3L));

        Employee permanentPeer = new Employee();
        permanentPeer.setId(11L);
        permanentPeer.setDepartment(newDepartment(1L));
        permanentPeer.setPosition(TestFixtures.newPositionWithLevel(3L));
        permanentPeer.setStaffType(newStaffType(StaffTypes.PERMANENT));

        Employee probationPeer = new Employee();
        probationPeer.setId(12L);
        probationPeer.setDepartment(newDepartment(1L));
        probationPeer.setPosition(TestFixtures.newPositionWithLevel(3L));
        probationPeer.setStaffType(newStaffType(StaffTypes.PROBATION));

        when(employeeRepository.findById(eq(10L))).thenReturn(Optional.of(evaluator));
        when(employeeRepository.findByDepartmentId(eq(1L))).thenReturn(List.of(evaluator, permanentPeer, probationPeer));

        List<Employee> result = feedbackService.getEligibleEvaluatees(10L, "PEER");

        assertEquals(1, result.size());
        assertEquals(11L, result.get(0).getId());
    }

    @Test
    void submitFeedback_throwsForProbationEvaluatee() {
        Employee evaluator = new Employee();
        evaluator.setId(10L);
        evaluator.setDepartment(newDepartment(1L));

        Employee probationEvaluatee = new Employee();
        probationEvaluatee.setId(12L);
        probationEvaluatee.setDepartment(newDepartment(1L));
        probationEvaluatee.setStaffType(newStaffType(StaffTypes.PROBATION));

        FeedbackSubmissionRequest request = new FeedbackSubmissionRequest();
        request.setEvaluateeId(12L);
        request.setRole("PEER");

        when(employeeRepository.findById(eq(10L))).thenReturn(Optional.of(evaluator));
        when(employeeRepository.findById(eq(12L))).thenReturn(Optional.of(probationEvaluatee));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> feedbackService.submitFeedback(10L, request));
        assertEquals("Probation employees cannot receive 360 feedback", ex.getMessage());
    }

    @Test
    void submitFeedback_rejectsAdditionalCommentsOverMaxLength() {
        FeedbackSubmissionRequest request = new FeedbackSubmissionRequest();
        request.setAdditionalComments("a".repeat(1001));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> feedbackService.submitFeedback(10L, request));
        assertEquals("Additional comments must be 1000 characters or fewer", ex.getMessage());
    }

    @Test
    void submitFeedback_recordsAuditActivityAfterSuccessfulSave() {
        Department department = newDepartment(1L);
        Employee evaluator = newEmployee(10L, "Alice Evaluator", department);
        Employee evaluatee = newEmployee(12L, "Bob Evaluatee", department);
        Criteria criteria = new Criteria();
        criteria.setId(100L);
        ReviewCycle cycle = newReviewCycle(7L, "Q2 2026");
        User evaluatorUser = newUser(30L, 40L);

        FeedbackSubmissionRequest.FeedbackDetailRequest detail = new FeedbackSubmissionRequest.FeedbackDetailRequest();
        detail.setCriteriaId(100L);
        detail.setRating(4);
        detail.setComment("Sensitive answer comment");

        FeedbackSubmissionRequest request = new FeedbackSubmissionRequest();
        request.setEvaluateeId(12L);
        request.setRole("PEER");
        request.setAnonymous(true);
        request.setAdditionalComments("Sensitive additional comments");
        request.setDetails(List.of(detail));

        TimeSettingDto timeSetting = new TimeSettingDto();
        timeSetting.setStartDate(LocalDate.of(2026, 4, 1));
        timeSetting.setEndDate(LocalDate.of(2026, 6, 30));

        when(employeeRepository.findById(eq(10L))).thenReturn(Optional.of(evaluator));
        when(employeeRepository.findById(eq(12L))).thenReturn(Optional.of(evaluatee));
        when(timeSettingService.getCurrentCycleRange()).thenReturn(timeSetting);
        when(feedbackRepository.countByEvaluatorIdAndRoleAndCreatedDateBetween(eq(10L), eq("PEER"), any(), any()))
                .thenReturn(0L);
        when(feedbackRepository.existsByEvaluatorIdAndEvaluateeIdAndCreatedDateBetween(eq(10L), eq(12L), any(), any()))
                .thenReturn(false);
        when(reviewCycleService.getActiveSubmissionCycle()).thenReturn(cycle);
        when(criteriaRepository.findById(eq(100L))).thenReturn(Optional.of(criteria));
        when(feedbackRepository.save(any(Feedback.class))).thenAnswer(invocation -> {
            Feedback feedback = invocation.getArgument(0);
            feedback.setId(55L);
            return feedback;
        });
        when(userRepository.findByEmployee_Id(eq(10L))).thenReturn(Optional.of(evaluatorUser));
        when(userRepository.findByEmployee_Id(eq(12L))).thenReturn(Optional.empty());

        feedbackService.submitFeedback(10L, request);

        ArgumentCaptor<String> descriptionCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> metadataCaptor = ArgumentCaptor.forClass(String.class);
        verify(auditService).record(
                eq(AuditActionType.FEEDBACK_360_SUBMITTED),
                eq(AuditTargetType.FEEDBACK_360),
                eq(55L),
                eq(30L),
                eq(40L),
                descriptionCaptor.capture(),
                metadataCaptor.capture());

        String description = descriptionCaptor.getValue();
        assertTrue(description.contains("Alice Evaluator"));
        assertTrue(description.contains("Bob Evaluatee"));
        assertTrue(description.contains("PEER"));
        assertTrue(description.contains("Q2 2026"));
        assertTrue(description.contains("7"));

        String metadata = metadataCaptor.getValue();
        assertTrue(metadata.contains("\"feedbackId\":55"));
        assertTrue(metadata.contains("\"evaluatorEmployeeId\":10"));
        assertTrue(metadata.contains("\"evaluatorName\":\"Alice Evaluator\""));
        assertTrue(metadata.contains("\"evaluateeEmployeeId\":12"));
        assertTrue(metadata.contains("\"evaluateeName\":\"Bob Evaluatee\""));
        assertTrue(metadata.contains("\"role\":\"PEER\""));
        assertTrue(metadata.contains("\"anonymous\":true"));
        assertTrue(metadata.contains("\"score\":80.0"));
        assertTrue(metadata.contains("\"remark\":\"Good\""));
        assertTrue(metadata.contains("\"reviewCycleId\":7"));
        assertTrue(metadata.contains("\"reviewCycleName\":\"Q2 2026\""));
        assertFalse(metadata.contains("Sensitive answer comment"));
        assertFalse(metadata.contains("Sensitive additional comments"));
    }

    @Test
    void saveDraftAndDeleteDraft_doNotRecordAuditActivity() {
        Department department = newDepartment(1L);
        Employee evaluator = newEmployee(10L, "Alice Evaluator", department);
        Employee evaluatee = newEmployee(12L, "Bob Evaluatee", department);
        ReviewCycle cycle = newReviewCycle(7L, "Q2 2026");

        FeedbackSubmissionRequest request = new FeedbackSubmissionRequest();
        request.setEvaluateeId(12L);
        request.setRole("PEER");
        request.setDetails(List.of());

        when(employeeRepository.findById(eq(10L))).thenReturn(Optional.of(evaluator));
        when(employeeRepository.findById(eq(12L))).thenReturn(Optional.of(evaluatee));
        when(reviewCycleService.getActiveSubmissionCycle()).thenReturn(cycle);
        when(feedbackDraftRepository.findByEvaluatorIdAndEvaluateeIdAndRoleAndReviewCycleId(eq(10L), eq(12L), eq("PEER"), eq(7L)))
                .thenReturn(Optional.empty());
        when(feedbackDraftRepository.save(any(FeedbackDraft.class))).thenAnswer(invocation -> {
            FeedbackDraft draft = invocation.getArgument(0);
            draft.setId(99L);
            return draft;
        });

        feedbackService.saveDraft(10L, request);

        FeedbackDraft draft = new FeedbackDraft();
        draft.setId(99L);
        when(feedbackDraftRepository.findByIdAndEvaluatorId(eq(99L), eq(10L))).thenReturn(Optional.of(draft));

        feedbackService.deleteDraft(10L, 99L);

        verifyNoInteractions(auditService);
    }

    private static Department newDepartment(Long id) {
        Department department = new Department();
        department.setId(id);
        return department;
    }

    private static Employee newEmployee(Long id, String name, Department department) {
        Employee employee = new Employee();
        employee.setId(id);
        employee.setEmployeeName(name);
        employee.setDepartment(department);
        return employee;
    }

    private static ReviewCycle newReviewCycle(Long id, String name) {
        ReviewCycle cycle = new ReviewCycle();
        cycle.setId(id);
        cycle.setName(name);
        return cycle;
    }

    private static User newUser(Long id, Long roleId) {
        Role role = new Role();
        role.setId(roleId);
        User user = new User();
        user.setId(id);
        user.setRole(role);
        return user;
    }

    private static StaffType newStaffType(long id) {
        StaffType staffType = new StaffType();
        staffType.setId(id);
        return staffType;
    }

    private static final class TestFixtures {
        private TestFixtures() {
        }

        private static com.epms.backend.entity.Position newPositionWithLevel(Long levelId) {
            com.epms.backend.entity.Position position = new com.epms.backend.entity.Position();
            com.epms.backend.entity.LevelCode levelCode = new com.epms.backend.entity.LevelCode();
            levelCode.setId(levelId);
            position.setLevelCode(levelCode);
            return position;
        }
    }
}
