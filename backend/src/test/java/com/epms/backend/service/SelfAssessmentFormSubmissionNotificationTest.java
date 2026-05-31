package com.epms.backend.service;

import com.epms.backend.dto.selfassessmentform.SubmitFormRequest;
import com.epms.backend.entity.*;
import com.epms.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SelfAssessmentFormSubmissionNotificationTest {

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
    private SelfAssessmentUnlockRequestRepository unlockRequestRepository;
    @Mock
    private SelfAssessmentArchiveSnapshotRepository archiveSnapshotRepository;
    @Mock
    private ScoreExplanationRepository scoreExplanationRepository;

    private ReportingManagerResolver reportingManagerResolver;
    private SelfAssessmentFormService service;

    @BeforeEach
    void setUp() {
        reportingManagerResolver = new ReportingManagerResolver(employeeRepository);
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
    void submitForm_notifiesDepartmentManagerWhenLineManagerCannotReceiveNotifications() {
        ReviewCycle cycle = new ReviewCycle();
        cycle.setId(1L);
        cycle.setName("Q1 2026");
        when(reviewCycleService.getActiveSubmissionCycle()).thenReturn(cycle);

        Employee inactiveLineManager = managerEmployee(50L, "Former Manager", false);
        Employee financeManager = managerEmployee(60L, "Finance Manager", true);
        Employee employee = financeStaffEmployee(100L, inactiveLineManager, financeManager.getId());

        SelfAssessmentForm form = draftForm(employee, cycle);
        when(formRepository.findByEmployeeAndCycle(employee, cycle)).thenReturn(Optional.of(form));
        when(formRepository.existsByEmployeeAndCycle(employee, cycle)).thenReturn(true);
        when(formRepository.findByEmployee(employee)).thenReturn(List.of(form));
        when(formRepository.save(any(SelfAssessmentForm.class))).thenAnswer(invocation -> invocation.getArgument(0));

        when(employeeRepository.findById(financeManager.getId())).thenReturn(Optional.of(financeManager));

        Signature signature = new Signature();
        signature.setId(1L);
        when(signatureRepository.findByUserAndIsDefaultTrue(employee.getUserAccount())).thenReturn(Optional.of(signature));

        service.submitForm(employee, new SubmitFormRequest(List.of(), null, null));

        verify(notificationService).send(
                eq(financeManager.getUserAccount()),
                eq("Self-Assessment Submitted"),
                contains("Finance Analyst"),
                eq("SELF_ASSESSMENT_FORM"),
                eq(form.getId()));
    }

    private static Employee financeStaffEmployee(Long id, Employee lineManager, Long departmentManagerId) {
        Department finance = new Department();
        finance.setId(11L);
        finance.setName("Finance");
        finance.setManagerId(departmentManagerId);

        Role employeeRole = new Role();
        employeeRole.setId(3L);

        User user = new User();
        user.setId(1000L);
        user.setActive(true);
        user.setRole(employeeRole);

        Employee employee = new Employee();
        employee.setId(id);
        employee.setEmployeeName("Finance Analyst");
        employee.setDepartment(finance);
        employee.setManager(lineManager);
        employee.setUserAccount(user);
        return employee;
    }

    private static Employee managerEmployee(Long id, String name, boolean active) {
        Role managerRole = new Role();
        managerRole.setId(2L);

        User user = new User();
        user.setId(2000L + id);
        user.setActive(active);
        user.setRole(managerRole);

        Employee manager = new Employee();
        manager.setId(id);
        manager.setEmployeeName(name);
        manager.setUserAccount(user);
        return manager;
    }

    private static SelfAssessmentForm draftForm(Employee employee, ReviewCycle cycle) {
        SelfAssessmentFormTemplate template = new SelfAssessmentFormTemplate();
        template.setId(1L);
        template.setTitle("Finance Self-Assessment");

        SelfAssessmentForm form = new SelfAssessmentForm();
        form.setId(200L);
        form.setEmployee(employee);
        form.setCycle(cycle);
        form.setTemplate(template);
        form.setStatus(SelfAssessmentFormStatus.DRAFT);
        form.setStartDate(LocalDate.now().minusDays(1));
        form.setDeadlineDate(LocalDate.now().plusDays(7));
        form.setManagerReviewDeadlineDate(LocalDate.now().plusDays(14));
        form.setRatingSystem(SelfAssessmentRatingSystem.FIVE_POINT);
        form.setIncludeYesNo(false);
        form.setAnswers(List.of());
        form.setCreatedDate(Instant.now());
        return form;
    }
}
