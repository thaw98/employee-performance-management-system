package com.epms.backend.service;

import com.epms.backend.StaffTypes;
import com.epms.backend.dto.selfassessmentform.AnswerRequest;
import com.epms.backend.dto.selfassessmentform.CreateTemplateRequest;
import com.epms.backend.dto.selfassessmentform.ManagerAdjustmentRequest;
import com.epms.backend.dto.selfassessmentform.ManagerReviewRequest;
import com.epms.backend.dto.selfassessmentform.QuestionRequest;
import com.epms.backend.dto.selfassessmentform.SelfAssessmentAssignmentRequest;
import com.epms.backend.dto.selfassessmentform.SelfAssessmentAssignmentResponse;
import com.epms.backend.dto.selfassessmentform.SelfAssessmentSettingsRequest;
import com.epms.backend.dto.selfassessmentform.SubmitFormRequest;
import com.epms.backend.entity.Department;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.EmployeeStatus;
import com.epms.backend.entity.Position;
import com.epms.backend.entity.ReviewCycle;
import com.epms.backend.entity.SelfAssessmentForm;
import com.epms.backend.entity.SelfAssessmentFormAnswer;
import com.epms.backend.entity.SelfAssessmentFormStatus;
import com.epms.backend.entity.SelfAssessmentFormTemplate;
import com.epms.backend.entity.SelfAssessmentFormTemplateQuestion;
import com.epms.backend.entity.SelfAssessmentRatingSystem;
import com.epms.backend.entity.SelfAssessmentSettings;
import com.epms.backend.entity.Signature;
import com.epms.backend.entity.User;
import com.epms.backend.repository.DepartmentRepository;
import com.epms.backend.repository.CopiedSelfAssessmentFormTemplateRepository;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.NotificationRepository;
import com.epms.backend.repository.PositionRepository;
import com.epms.backend.repository.SelfAssessmentFormAdjustmentRepository;
import com.epms.backend.repository.SelfAssessmentFormRepository;
import com.epms.backend.repository.SelfAssessmentSettingsRepository;
import com.epms.backend.repository.SelfAssessmentFormTemplateRepository;
import com.epms.backend.repository.SignatureRepository;
import com.epms.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SelfAssessmentFormAssignmentServiceTest {

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
    private UserRepository userRepository;
    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private SelfAssessmentSettingsRepository settingsRepository;

    private SelfAssessmentFormService service;

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
                userRepository,
                notificationRepository,
                settingsRepository);
    }

    @Test
    void assignSelfAssessmentForms_createsFormFromMatchingActiveCycleTemplate() {
        ReviewCycle cycle = cycle();
        Employee employee = employee(1L, 10L, 20L);
        SelfAssessmentFormTemplate template = template(100L, 10L, 20L, cycle);

        when(reviewCycleService.getActiveSubmissionCycle()).thenReturn(cycle);
        when(employeeRepository.findEligibleSelfAssessmentAssignees(EmployeeStatus.ACTIVE, StaffTypes.PROBATION))
                .thenReturn(List.of(employee));
        when(formRepository.existsByEmployeeAndCycle(employee, cycle)).thenReturn(false);
        when(templateRepository.findActiveByDepartmentAndPositionAndReviewCycleId(10L, 20L, 7L))
                .thenReturn(Optional.of(template));

        SelfAssessmentAssignmentResponse response = service.assignSelfAssessmentForms(request("ALL_EMPLOYEES"), 99L);

        assertEquals(1, response.createdCount());
        assertEquals(0, response.skippedExistingCount());
        assertEquals(0, response.skippedNoTemplateCount());

        ArgumentCaptor<SelfAssessmentForm> formCaptor = ArgumentCaptor.forClass(SelfAssessmentForm.class);
        verify(formRepository).save(formCaptor.capture());
        SelfAssessmentForm savedForm = formCaptor.getValue();
        assertEquals(employee, savedForm.getEmployee());
        assertEquals(template, savedForm.getTemplate());
        assertEquals(LocalDate.of(2026, 5, 10), savedForm.getDeadlineDate());
        assertEquals(LocalDate.of(2026, 5, 15), savedForm.getManagerReviewDeadlineDate());
        assertEquals(LocalDate.of(2026, 5, 31), savedForm.getFinalApprovalDeadlineDate());
        assertEquals(SelfAssessmentRatingSystem.FIVE_POINT, savedForm.getRatingSystem());
        assertEquals(1, savedForm.getAnswers().size());

        verify(notificationService).send(
                eq(employee.getUserAccount()),
                eq("Self-Assessment Assigned"),
                eq("A self-assessment form has been assigned to you. Deadline: 10-05-2026"),
                eq("SELF_ASSESSMENT_FORM"));
    }

    @Test
    void assignSelfAssessmentForms_snapshotsTemplateRatingSystem() {
        ReviewCycle cycle = cycle();
        Employee employee = employee(1L, 10L, 20L);
        SelfAssessmentFormTemplate template = template(100L, 10L, 20L, cycle);
        template.setRatingSystem(SelfAssessmentRatingSystem.TEN_POINT);
        template.setTenPointYesMinRating(7);

        when(reviewCycleService.getActiveSubmissionCycle()).thenReturn(cycle);
        when(employeeRepository.findEligibleSelfAssessmentAssignees(EmployeeStatus.ACTIVE, StaffTypes.PROBATION))
                .thenReturn(List.of(employee));
        when(formRepository.existsByEmployeeAndCycle(employee, cycle)).thenReturn(false);
        when(templateRepository.findActiveByDepartmentAndPositionAndReviewCycleId(10L, 20L, 7L))
                .thenReturn(Optional.of(template));

        service.assignSelfAssessmentForms(request("ALL_EMPLOYEES"), 99L);

        ArgumentCaptor<SelfAssessmentForm> formCaptor = ArgumentCaptor.forClass(SelfAssessmentForm.class);
        verify(formRepository).save(formCaptor.capture());
        assertEquals(SelfAssessmentRatingSystem.TEN_POINT, formCaptor.getValue().getRatingSystem());
        assertEquals(7, formCaptor.getValue().getTenPointYesMinRating());
    }

    @Test
    void updateSettings_savesThresholdAndSyncsUnassignedActiveCycleTemplates() {
        ReviewCycle cycle = cycle();
        SelfAssessmentSettings settings = new SelfAssessmentSettings();
        SelfAssessmentFormTemplate template = template(100L, 10L, 20L, cycle);

        when(settingsRepository.findById(SelfAssessmentSettings.SINGLETON_ID)).thenReturn(Optional.of(settings));
        when(settingsRepository.save(settings)).thenReturn(settings);
        when(reviewCycleService.getActiveSubmissionCycle()).thenReturn(cycle);
        when(templateRepository.findActiveByReviewCycleId(cycle.getId())).thenReturn(List.of(template));
        when(formRepository.existsByTemplate(template)).thenReturn(false);

        service.updateSettings(new SelfAssessmentSettingsRequest("TEN_POINT", 7), 99L);

        assertEquals(SelfAssessmentRatingSystem.TEN_POINT, settings.getRatingSystem());
        assertEquals(7, settings.getTenPointYesMinRating());
        assertEquals(SelfAssessmentRatingSystem.TEN_POINT, template.getRatingSystem());
        assertEquals(7, template.getTenPointYesMinRating());
        verify(templateRepository).saveAll(List.of(template));
    }

    @Test
    void assignSelfAssessmentForms_skipsExistingAndNoTemplateEmployees() {
        ReviewCycle cycle = cycle();
        Employee existing = employee(1L, 10L, 20L);
        Employee missingTemplate = employee(2L, 10L, 30L);

        when(reviewCycleService.getActiveSubmissionCycle()).thenReturn(cycle);
        when(employeeRepository.findEligibleSelfAssessmentAssignees(EmployeeStatus.ACTIVE, StaffTypes.PROBATION))
                .thenReturn(List.of(existing, missingTemplate));
        when(formRepository.existsByEmployeeAndCycle(existing, cycle)).thenReturn(true);
        when(formRepository.existsByEmployeeAndCycle(missingTemplate, cycle)).thenReturn(false);
        when(templateRepository.findActiveByDepartmentAndPositionAndReviewCycleId(10L, 30L, 7L))
                .thenReturn(Optional.empty());

        SelfAssessmentAssignmentResponse response = service.assignSelfAssessmentForms(request("ALL_EMPLOYEES"), 99L);

        assertEquals(0, response.createdCount());
        assertEquals(1, response.skippedExistingCount());
        assertEquals(1, response.skippedNoTemplateCount());
        verify(formRepository, never()).save(any(SelfAssessmentForm.class));
        verify(notificationService, never()).send(any(), any(), any(), any());
    }

    @Test
    void assignSelfAssessmentForms_hybridUsesDepartmentAndPositionIntersection() {
        ReviewCycle cycle = cycle();
        Employee match = employee(1L, 10L, 20L);
        Employee wrongPosition = employee(2L, 10L, 21L);
        SelfAssessmentFormTemplate template = template(100L, 10L, 20L, cycle);

        when(reviewCycleService.getActiveSubmissionCycle()).thenReturn(cycle);
        when(employeeRepository.findEligibleSelfAssessmentAssignees(EmployeeStatus.ACTIVE, StaffTypes.PROBATION))
                .thenReturn(List.of(match, wrongPosition));
        when(formRepository.existsByEmployeeAndCycle(match, cycle)).thenReturn(false);
        when(templateRepository.findActiveByDepartmentAndPositionAndReviewCycleId(10L, 20L, 7L))
                .thenReturn(Optional.of(template));

        SelfAssessmentAssignmentRequest request = new SelfAssessmentAssignmentRequest(
                "HYBRID",
                List.of(10L),
                List.of(20L),
                LocalDate.of(2026, 5, 10),
                LocalDate.of(2026, 5, 15));

        SelfAssessmentAssignmentResponse response = service.assignSelfAssessmentForms(request, 99L);

        assertEquals(1, response.createdCount());
        verify(formRepository, never()).existsByEmployeeAndCycle(wrongPosition, cycle);
    }

    @Test
    void assignSelfAssessmentForms_rejectsInvalidDeadlineOrder() {
        when(reviewCycleService.getActiveSubmissionCycle()).thenReturn(cycle());

        SelfAssessmentAssignmentRequest request = new SelfAssessmentAssignmentRequest(
                "ALL_EMPLOYEES",
                List.of(),
                List.of(),
                LocalDate.of(2026, 5, 16),
                LocalDate.of(2026, 5, 15));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.assignSelfAssessmentForms(request, 99L));

        assertTrue(ex.getMessage().contains("Manager review deadline cannot be earlier"));
        verify(employeeRepository, never()).findEligibleSelfAssessmentAssignees(any(), any());
    }

    @Test
    void createTemplate_usesGlobalRatingSystemWhenRequestOmitsRatingSystem() {
        ReviewCycle cycle = cycle();
        Department department = new Department();
        department.setId(10L);
        department.setName("Department 10");
        Position position = new Position();
        position.setId(20L);
        position.setName("Position 20");
        SelfAssessmentSettings settings = new SelfAssessmentSettings();
        settings.setRatingSystem(SelfAssessmentRatingSystem.TEN_POINT);

        when(reviewCycleService.resolveCycleForSelfAssessmentTemplate(7L)).thenReturn(cycle);
        when(departmentRepository.findById(10L)).thenReturn(Optional.of(department));
        when(positionRepository.findById(20L)).thenReturn(Optional.of(position));
        when(templateRepository.findActiveByDepartmentAndPositionAndReviewCycleId(10L, 20L, 7L))
                .thenReturn(Optional.empty());
        when(settingsRepository.findById(SelfAssessmentSettings.SINGLETON_ID)).thenReturn(Optional.of(settings));
        when(templateRepository.saveAndFlush(any(SelfAssessmentFormTemplate.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(templateRepository.save(any(SelfAssessmentFormTemplate.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.createTemplate(new CreateTemplateRequest(
                "Template",
                10L,
                20L,
                List.of(new QuestionRequest(null, "What did you achieve?", 0)),
                null,
                7L,
                null,
                null), 99L);

        ArgumentCaptor<SelfAssessmentFormTemplate> templateCaptor = ArgumentCaptor.forClass(SelfAssessmentFormTemplate.class);
        verify(templateRepository).saveAndFlush(templateCaptor.capture());
        assertEquals(SelfAssessmentRatingSystem.TEN_POINT, templateCaptor.getValue().getRatingSystem());
    }

    @Test
    void submitForm_notifiesDirectManagerOnSuccessfulSubmit() {
        ReviewCycle cycle = cycle();
        Employee employee = employee(1L, 10L, 20L);
        employee.setEmployeeName("Jane Doe");
        Employee manager = employee(2L, 10L, 20L);
        employee.setManager(manager);
        SelfAssessmentForm form = formForSubmit(employee, template(100L, 10L, 20L, cycle), cycle, SelfAssessmentFormStatus.DRAFT);
        stubSuccessfulSubmit(employee, cycle, form);

        service.submitForm(employee, submitRequest());

        verify(notificationService).send(
                eq(manager.getUserAccount()),
                eq("Self-Assessment Submitted"),
                eq("Employee Jane Doe submitted Template for your review."),
                eq("SELF_ASSESSMENT_FORM"));
        verify(employeeRepository, never()).findById(any());
    }

    @Test
    void submitForm_notifiesDepartmentManagerWhenDirectManagerAbsent() {
        ReviewCycle cycle = cycle();
        Employee employee = employee(1L, 10L, 20L);
        Employee departmentManager = employee(3L, 10L, 20L);
        employee.getDepartment().setManagerId(departmentManager.getId());
        SelfAssessmentForm form = formForSubmit(employee, template(100L, 10L, 20L, cycle), cycle, SelfAssessmentFormStatus.DRAFT);
        stubSuccessfulSubmit(employee, cycle, form);
        when(employeeRepository.findById(departmentManager.getId())).thenReturn(Optional.of(departmentManager));

        service.submitForm(employee, submitRequest());

        verify(notificationService).send(
                eq(departmentManager.getUserAccount()),
                eq("Self-Assessment Submitted"),
                eq("Employee Employee 1 submitted Template for your review."),
                eq("SELF_ASSESSMENT_FORM"));
    }

    @Test
    void submitForm_skipsNotificationWhenResolvedManagerHasNoActiveUserAccount() {
        ReviewCycle cycle = cycle();
        Employee employee = employee(1L, 10L, 20L);
        Employee manager = employee(2L, 10L, 20L);
        manager.setUserAccount(null);
        employee.setManager(manager);
        SelfAssessmentForm form = formForSubmit(employee, template(100L, 10L, 20L, cycle), cycle, SelfAssessmentFormStatus.DRAFT);
        stubSuccessfulSubmit(employee, cycle, form);

        service.submitForm(employee, submitRequest());

        verify(notificationService, never()).send(any(), eq("Self-Assessment Submitted"), any(), eq("SELF_ASSESSMENT_FORM"));
    }

    @Test
    void submitForm_validatesEmployeeAnswersAgainstSavedTenPointThreshold() {
        ReviewCycle cycle = cycle();
        Employee employee = employee(1L, 10L, 20L);
        SelfAssessmentForm form = formForSubmit(employee, template(100L, 10L, 20L, cycle), cycle, SelfAssessmentFormStatus.DRAFT);
        form.setRatingSystem(SelfAssessmentRatingSystem.TEN_POINT);
        form.setTenPointYesMinRating(7);

        when(reviewCycleService.getActiveSubmissionCycle()).thenReturn(cycle);
        when(formRepository.findByEmployeeAndCycle(employee, cycle)).thenReturn(Optional.of(form));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.submitForm(
                employee,
                new SubmitFormRequest(
                        List.of(new AnswerRequest(501L, "Yes", 6, "Too low for Yes")),
                        "Employee remarks",
                        "Overall remarks")));

        assertEquals("Rating does not match the form rating system", ex.getMessage());
        verify(signatureRepository, never()).findByUserAndIsDefaultTrue(any());
    }

    @Test
    void managerReview_validatesAdjustmentsAgainstSavedTenPointThreshold() {
        ReviewCycle cycle = cycle();
        Employee manager = employee(2L, 10L, 20L);
        Employee employee = employee(1L, 10L, 20L);
        employee.setManager(manager);
        SelfAssessmentForm form = formForSubmit(employee, template(100L, 10L, 20L, cycle), cycle, SelfAssessmentFormStatus.SUBMITTED);
        form.setRatingSystem(SelfAssessmentRatingSystem.TEN_POINT);
        form.setTenPointYesMinRating(8);

        when(formRepository.findById(form.getId())).thenReturn(Optional.of(form));
        when(signatureRepository.findByUserAndIsDefaultTrue(manager.getUserAccount()))
                .thenReturn(Optional.of(signature(manager.getUserAccount())));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> service.managerReview(
                form.getId(),
                manager,
                new ManagerReviewRequest(
                        "Needs adjustment",
                        List.of(new ManagerAdjustmentRequest(501L, "Yes", 7, "Below saved threshold")))));

        assertEquals("Proposed rating does not match the form rating system", ex.getMessage());
        verify(adjustmentRepository, never()).save(any());
    }

    @Test
    void submitForm_reopenedResubmissionCreatesAnotherNotification() {
        ReviewCycle cycle = cycle();
        Employee employee = employee(1L, 10L, 20L);
        Employee manager = employee(2L, 10L, 20L);
        employee.setManager(manager);
        SelfAssessmentForm form = formForSubmit(employee, template(100L, 10L, 20L, cycle), cycle, SelfAssessmentFormStatus.DRAFT);
        stubSuccessfulSubmit(employee, cycle, form);

        service.submitForm(employee, submitRequest());
        form.setStatus(SelfAssessmentFormStatus.REOPENED);
        service.submitForm(employee, submitRequest());

        verify(notificationService, times(2)).send(
                eq(manager.getUserAccount()),
                eq("Self-Assessment Submitted"),
                eq("Employee Employee 1 submitted Template for your review."),
                eq("SELF_ASSESSMENT_FORM"));
    }

    @Test
    void getManagerReviewForms_includesDirectManagerAssignments() {
        ReviewCycle cycle = cycle();
        Employee manager = employee(2L, 10L, 20L);
        Employee employee = employee(1L, 10L, 20L);
        employee.setManager(manager);
        SelfAssessmentForm form = formForSubmit(employee, template(100L, 10L, 20L, cycle), cycle, SelfAssessmentFormStatus.SUBMITTED);

        when(reviewCycleService.getActiveSubmissionCycle()).thenReturn(cycle);
        when(formRepository.findByManagerAndCycle(manager.getId(), cycle)).thenReturn(List.of(form));

        assertEquals(1, service.getManagerReviewForms(manager).size());
        verify(formRepository).findByManagerAndCycle(manager.getId(), cycle);
    }

    private static SelfAssessmentAssignmentRequest request(String mode) {
        return new SelfAssessmentAssignmentRequest(
                mode,
                List.of(),
                List.of(),
                LocalDate.of(2026, 5, 10),
                LocalDate.of(2026, 5, 15));
    }

    private static ReviewCycle cycle() {
        ReviewCycle cycle = new ReviewCycle();
        cycle.setId(7L);
        cycle.setName("Q2 2026");
        cycle.setCode("Q2-2026");
        cycle.setStartDate(LocalDate.of(2026, 5, 1));
        cycle.setEndDate(LocalDate.of(2026, 5, 31));
        cycle.setRequiresEmployeeSubmission(true);
        return cycle;
    }

    private static Employee employee(Long id, Long departmentId, Long positionId) {
        Department department = new Department();
        department.setId(departmentId);
        department.setName("Department " + departmentId);

        Position position = new Position();
        position.setId(positionId);
        position.setName("Position " + positionId);

        Employee employee = new Employee();
        employee.setId(id);
        employee.setEmployeeName("Employee " + id);
        employee.setEmployeeId("EMP-" + id);
        employee.setEmail("employee" + id + "@example.com");
        employee.setDepartment(department);
        employee.setPosition(position);

        User user = new User();
        user.setId(id);
        user.setEmployee(employee);
        user.setActive(true);
        employee.setUserAccount(user);
        return employee;
    }

    private static SelfAssessmentFormTemplate template(Long id, Long departmentId, Long positionId, ReviewCycle cycle) {
        Department department = new Department();
        department.setId(departmentId);

        Position position = new Position();
        position.setId(positionId);

        SelfAssessmentFormTemplate template = new SelfAssessmentFormTemplate();
        template.setId(id);
        template.setTitle("Template");
        template.setDepartment(department);
        template.setPosition(position);
        template.setReviewCycle(cycle);
        template.setActive(true);

        SelfAssessmentFormTemplateQuestion question = new SelfAssessmentFormTemplateQuestion();
        question.setQuestionText("What did you achieve?");
        question.setSortOrder(0);
        template.addQuestion(question);
        return template;
    }

    private void stubSuccessfulSubmit(Employee employee, ReviewCycle cycle, SelfAssessmentForm form) {
        when(reviewCycleService.getActiveSubmissionCycle()).thenReturn(cycle);
        when(formRepository.findByEmployeeAndCycle(employee, cycle)).thenReturn(Optional.of(form));
        when(formRepository.existsByEmployeeAndCycle(employee, cycle)).thenReturn(true);
        when(formRepository.findByEmployee(employee)).thenReturn(List.of(form));
        when(signatureRepository.findByUserAndIsDefaultTrue(employee.getUserAccount()))
                .thenReturn(Optional.of(signature(employee.getUserAccount())));
        when(formRepository.save(form)).thenReturn(form);
        when(adjustmentRepository.findByForm(form)).thenReturn(List.of());
    }

    private static SubmitFormRequest submitRequest() {
        return new SubmitFormRequest(
                List.of(new AnswerRequest(501L, "Yes", 5, "Completed goals")),
                "Employee remarks",
                "Overall remarks");
    }

    private static SelfAssessmentForm formForSubmit(
            Employee employee,
            SelfAssessmentFormTemplate template,
            ReviewCycle cycle,
            SelfAssessmentFormStatus status) {
        SelfAssessmentForm form = new SelfAssessmentForm();
        form.setId(200L);
        form.setEmployee(employee);
        form.setTemplate(template);
        form.setCycle(cycle);
        form.setRatingSystem(SelfAssessmentRatingSystem.FIVE_POINT);
        form.setStatus(status);
        form.setDeadlineDate(LocalDate.of(2026, 5, 10));
        form.setCreatedDate(java.time.Instant.parse("2026-05-01T00:00:00Z"));

        SelfAssessmentFormAnswer answer = new SelfAssessmentFormAnswer();
        answer.setId(501L);
        answer.setQuestionText("What did you achieve?");
        answer.setSortOrder(0);
        form.addAnswer(answer);
        return form;
    }

    private static Signature signature(User user) {
        Signature signature = new Signature();
        signature.setId(900L);
        signature.setUser(user);
        signature.setDefault(true);
        return signature;
    }
}
