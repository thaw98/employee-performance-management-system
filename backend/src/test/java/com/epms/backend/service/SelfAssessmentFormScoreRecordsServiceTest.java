package com.epms.backend.service;

import com.epms.backend.dto.selfassessmentform.ScoreRecordDto;
import com.epms.backend.entity.Department;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.Position;
import com.epms.backend.entity.ReviewCycle;
import com.epms.backend.entity.SelfAssessmentForm;
import com.epms.backend.entity.SelfAssessmentFormStatus;
import com.epms.backend.entity.SelfAssessmentFormTemplate;
import com.epms.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SelfAssessmentFormScoreRecordsServiceTest {

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
    void getScoreRecords_hr_returnsAllFinalizedRecords() {
        Employee emp1 = employee(1L, 10L, 20L);
        Employee emp2 = employee(2L, 11L, 21L);
        ReviewCycle cycle = cycle();
        SelfAssessmentFormTemplate tmpl = template(100L, 10L, 20L, cycle);

        SelfAssessmentForm finalized = finalizedForm(200L, emp1, tmpl, cycle, 85.5, "Outstanding");
        SelfAssessmentForm draft = formWithStatus(201L, emp2, tmpl, cycle, SelfAssessmentFormStatus.DRAFT);
        SelfAssessmentForm finalized2 = finalizedForm(202L, emp2, tmpl, cycle, 72.0, "Good");

        when(formRepository.findAll()).thenReturn(List.of(finalized, draft, finalized2));

        List<ScoreRecordDto> records = service.getScoreRecords(emp1, 1L);

        assertEquals(2, records.size());
        assertTrue(records.stream().allMatch(r -> "FINALIZED_LOCKED".equals(r.status())));
        assertTrue(records.stream().anyMatch(r -> r.finalApprovedScore() != null && r.finalApprovedScore() == 85.5));
        assertTrue(records.stream().anyMatch(r -> r.finalApprovedScore() != null && r.finalApprovedScore() == 72.0));
    }

    @Test
    void getScoreRecords_hr_noFinalizedForms_returnsEmptyList() {
        Employee emp = employee(1L, 10L, 20L);
        ReviewCycle cycle = cycle();
        SelfAssessmentFormTemplate tmpl = template(100L, 10L, 20L, cycle);
        SelfAssessmentForm draft = formWithStatus(200L, emp, tmpl, cycle, SelfAssessmentFormStatus.DRAFT);

        when(formRepository.findAll()).thenReturn(List.of(draft));

        List<ScoreRecordDto> records = service.getScoreRecords(emp, 1L);

        assertTrue(records.isEmpty());
    }

    @Test
    void getScoreRecords_manager_returnsOnlyScopedFinalizedRecords() {
        Department managedDept = department(10L);
        managedDept.setManagerId(100L);

        Employee manager = employee(100L, managedDept, 20L);

        Employee directReport = employee(1L, managedDept, 20L);
        directReport.setManager(manager);

        Employee deptReport = employee(2L, managedDept, 21L);

        Department otherDept = department(99L);
        Employee otherEmp = employee(3L, otherDept, 30L);

        ReviewCycle cycle = cycle();
        SelfAssessmentFormTemplate tmpl = template(100L, 10L, 20L, cycle);

        SelfAssessmentForm finalized1 = finalizedForm(200L, directReport, tmpl, cycle, 90.0, "Outstanding");
        SelfAssessmentForm finalized2 = finalizedForm(201L, deptReport, tmpl, cycle, 65.0, "Meet Requirement");
        SelfAssessmentForm finalized3 = finalizedForm(202L, otherEmp, tmpl, cycle, 80.0, "Good");

        when(formRepository.findAll()).thenReturn(List.of(finalized1, finalized2, finalized3));

        List<ScoreRecordDto> records = service.getScoreRecords(manager, 2L);

        assertEquals(2, records.size());
        assertTrue(records.stream().anyMatch(r -> r.employee().employeeName().equals("Employee 1")));
        assertTrue(records.stream().anyMatch(r -> r.employee().employeeName().equals("Employee 2")));
    }

    @Test
    void getScoreRecords_manager_noScopedEmployees_returnsEmptyList() {
        Department otherDept = department(99L);
        Employee manager = employee(100L, 10L, 20L);

        Employee otherEmp = employee(1L, otherDept, 30L);

        ReviewCycle cycle = cycle();
        SelfAssessmentFormTemplate tmpl = template(100L, 10L, 20L, cycle);
        SelfAssessmentForm finalized = finalizedForm(200L, otherEmp, tmpl, cycle, 80.0, "Good");

        when(formRepository.findAll()).thenReturn(List.of(finalized));

        List<ScoreRecordDto> records = service.getScoreRecords(manager, 2L);

        assertTrue(records.isEmpty());
    }

    @Test
    void getScoreRecords_unauthorizedRole_throwsException() {
        Employee emp = employee(1L, 10L, 20L);
        assertThrows(RuntimeException.class, () -> service.getScoreRecords(emp, 3L));
    }

    @Test
    void getScoreRecords_recordMapsFieldsCorrectly() {
        Employee emp = employee(1L, 10L, 20L);
        ReviewCycle cycle = cycle();
        SelfAssessmentFormTemplate tmpl = template(100L, 10L, 20L, cycle);

        SelfAssessmentForm form = finalizedForm(200L, emp, tmpl, cycle, 88.0, "Outstanding");

        when(formRepository.findAll()).thenReturn(List.of(form));

        List<ScoreRecordDto> records = service.getScoreRecords(emp, 1L);

        assertEquals(1, records.size());
        ScoreRecordDto record = records.get(0);
        assertEquals(200L, record.id());
        assertEquals("FINALIZED_LOCKED", record.status());
        assertEquals(88.0, record.finalApprovedScore());
        assertEquals("Outstanding", record.performance());
        assertEquals(7L, record.cycleId());
        assertEquals("Q2 2026", record.cycleName());
        assertNotNull(record.employee());
        assertEquals("Employee 1", record.employee().employeeName());
        assertEquals(10L, record.employee().departmentId());
        assertEquals("Department 10", record.employee().departmentName());
        assertEquals(20L, record.employee().positionId());
        assertEquals("Position 20", record.employee().positionName());
    }

    @Test
    void getScoreRecords_nullScoreAndPerformance() {
        Employee emp = employee(1L, 10L, 20L);
        ReviewCycle cycle = cycle();
        SelfAssessmentFormTemplate tmpl = template(100L, 10L, 20L, cycle);

        SelfAssessmentForm form = new SelfAssessmentForm();
        form.setId(200L);
        form.setEmployee(emp);
        form.setTemplate(tmpl);
        form.setCycle(cycle);
        form.setStatus(SelfAssessmentFormStatus.FINALIZED_LOCKED);
        form.setFinalApprovedTotalScore(null);
        form.setRatingCategory(null);
        form.setCreatedDate(Instant.parse("2026-05-01T00:00:00Z"));

        when(formRepository.findAll()).thenReturn(List.of(form));

        List<ScoreRecordDto> records = service.getScoreRecords(emp, 1L);

        assertEquals(1, records.size());
        assertNull(records.get(0).finalApprovedScore());
        assertNull(records.get(0).performance());
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

        return buildEmployee(id, department, position);
    }

    private static Employee employee(Long id, Department department, Long positionId) {
        Position position = new Position();
        position.setId(positionId);
        position.setName("Position " + positionId);

        return buildEmployee(id, department, position);
    }

    private static Employee buildEmployee(Long id, Department department, Position position) {
        Employee employee = new Employee();
        employee.setId(id);
        employee.setEmployeeName("Employee " + id);
        employee.setEmployeeId("EMP-" + id);
        employee.setEmail("employee" + id + "@example.com");
        employee.setDepartment(department);
        employee.setPosition(position);
        return employee;
    }

    private static Department department(Long id) {
        Department department = new Department();
        department.setId(id);
        department.setName("Department " + id);
        return department;
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
        return template;
    }

    private static SelfAssessmentForm finalizedForm(Long id, Employee emp, SelfAssessmentFormTemplate tmpl, ReviewCycle cycle, Double score, String category) {
        SelfAssessmentForm form = new SelfAssessmentForm();
        form.setId(id);
        form.setEmployee(emp);
        form.setTemplate(tmpl);
        form.setCycle(cycle);
        form.setStatus(SelfAssessmentFormStatus.FINALIZED_LOCKED);
        form.setFinalApprovedTotalScore(score);
        form.setRatingCategory(category);
        form.setCreatedDate(Instant.parse("2026-05-01T00:00:00Z"));
        form.setSubmittedDate(Instant.parse("2026-05-02T00:00:00Z"));
        form.setHrFinalSignatureDate(Instant.parse("2026-05-05T00:00:00Z"));
        return form;
    }

    private static SelfAssessmentForm formWithStatus(Long id, Employee emp, SelfAssessmentFormTemplate tmpl, ReviewCycle cycle, SelfAssessmentFormStatus status) {
        SelfAssessmentForm form = new SelfAssessmentForm();
        form.setId(id);
        form.setEmployee(emp);
        form.setTemplate(tmpl);
        form.setCycle(cycle);
        form.setStatus(status);
        form.setCreatedDate(Instant.parse("2026-05-01T00:00:00Z"));
        return form;
    }
}
