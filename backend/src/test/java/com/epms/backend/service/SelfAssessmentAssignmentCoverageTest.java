package com.epms.backend.service;

import com.epms.backend.StaffTypes;
import com.epms.backend.dto.selfassessmentform.AssignmentCoverageDto;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SelfAssessmentAssignmentCoverageTest {

    @Mock private SelfAssessmentFormTemplateRepository templateRepository;
    @Mock private CopiedSelfAssessmentFormTemplateRepository copiedTemplateRepository;
    @Mock private SelfAssessmentFormRepository formRepository;
    @Mock private SelfAssessmentFormAdjustmentRepository adjustmentRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private DepartmentRepository departmentRepository;
    @Mock private PositionRepository positionRepository;
    @Mock private SignatureRepository signatureRepository;
    @Mock private ReviewCycleService reviewCycleService;
    @Mock private NotificationService notificationService;
    @Mock private AuditService auditService;
    @Mock private AuditLogRepository auditLogRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private SelfAssessmentSettingsRepository settingsRepository;
    @Mock private ReportingManagerResolver reportingManagerResolver;
    @Mock private SelfAssessmentUnlockRequestRepository unlockRequestRepository;
    @Mock private SelfAssessmentArchiveSnapshotRepository archiveSnapshotRepository;
    @Mock private ScoreExplanationRepository scoreExplanationRepository;

    private SelfAssessmentFormService service;

    private ReviewCycle activeCycle;

    @BeforeEach
    void setUp() {
        service = new SelfAssessmentFormService(
                templateRepository, copiedTemplateRepository, formRepository,
                adjustmentRepository, employeeRepository, departmentRepository,
                positionRepository, signatureRepository, reviewCycleService,
                notificationService, auditService, auditLogRepository,
                userRepository, notificationRepository, settingsRepository,
                reportingManagerResolver, unlockRequestRepository,
                archiveSnapshotRepository, scoreExplanationRepository);

        activeCycle = new ReviewCycle();
        activeCycle.setId(1L);
        activeCycle.setName("Q2 2026");
        activeCycle.setCode("Q2-2026");
        activeCycle.setStartDate(LocalDate.of(2026, 4, 1));
        activeCycle.setEndDate(LocalDate.of(2026, 6, 30));
        activeCycle.setRequiresEmployeeSubmission(true);
    }

    @Test
    void noActiveCycle_returnsEmptyCoverage() {
        when(reviewCycleService.getActiveSubmissionCycle()).thenReturn(null);

        AssignmentCoverageDto coverage = service.getAssignmentCoverage();

        assertNull(coverage.activeCycle());
        assertEquals(0, coverage.eligibleCount());
        assertEquals(0, coverage.assignedEmployees().size());
        assertEquals(0, coverage.unassignedEmployees().size());
    }

    @Test
    void assignedEmployee_appearsInAssignedList() {
        when(reviewCycleService.getActiveSubmissionCycle()).thenReturn(activeCycle);

        Department dept = department(10L, "Engineering");
        Position pos = position(20L, "Developer");
        Employee emp = employee(1L, "EMP-1", "Alice", dept, pos);
        Employee mgr = employee(99L, "MGR-1", "Manager Bob", dept, pos);

        when(reportingManagerResolver.resolve(emp)).thenReturn(mgr);
        when(employeeRepository.findEligibleSelfAssessmentAssignees(
                eq(EmployeeStatus.ACTIVE), eq(StaffTypes.PROBATION)))
                .thenReturn(List.of(emp));

        SelfAssessmentFormTemplate template = template(100L, "Dev Review", dept, pos);
        SelfAssessmentForm form = new SelfAssessmentForm();
        form.setEmployee(emp);
        form.setTemplate(template);
        form.setCycle(activeCycle);
        form.setAssignedAt(Instant.parse("2026-04-05T09:00:00Z"));

        when(formRepository.findByCycleOrderByCreatedDateDesc(activeCycle)).thenReturn(List.of(form));

        AssignmentCoverageDto coverage = service.getAssignmentCoverage();

        assertEquals(1, coverage.eligibleCount());
        assertEquals(1, coverage.assignedCount());
        assertEquals(0, coverage.leftToAssignCount());
        assertEquals(100.0, coverage.coveragePercent());

        AssignmentCoverageDto.CoverageEmployeeRow row = coverage.assignedEmployees().get(0);
        assertEquals(1L, row.employeeId());
        assertEquals("EMP-1", row.employeeCode());
        assertEquals("Alice", row.employeeName());
        assertEquals("Engineering", row.departmentName());
        assertEquals("Developer", row.positionName());
        assertEquals("Manager Bob", row.managerName());
        assertEquals("ASSIGNED", row.assignmentStatus());
        assertEquals("Dev Review", row.templateTitle());
    }

    @Test
    void unassignedEmployee_appearsInLeftToAssignList() {
        when(reviewCycleService.getActiveSubmissionCycle()).thenReturn(activeCycle);

        Department dept = department(10L, "Engineering");
        Position pos = position(20L, "Developer");
        Employee emp = employee(1L, "EMP-1", "Alice", dept, pos);

        when(reportingManagerResolver.resolve(emp)).thenReturn(null);
        when(employeeRepository.findEligibleSelfAssessmentAssignees(
                eq(EmployeeStatus.ACTIVE), eq(StaffTypes.PROBATION)))
                .thenReturn(List.of(emp));

        when(formRepository.findByCycleOrderByCreatedDateDesc(activeCycle)).thenReturn(List.of());
        when(templateRepository.findActiveByDepartmentAndPositionAndReviewCycleId(10L, 20L, 1L))
                .thenReturn(Optional.of(template(100L, "Dev Review", dept, pos)));

        AssignmentCoverageDto coverage = service.getAssignmentCoverage();

        assertEquals(1, coverage.eligibleCount());
        assertEquals(0, coverage.assignedCount());
        assertEquals(1, coverage.leftToAssignCount());
        assertEquals(0.0, coverage.coveragePercent());

        AssignmentCoverageDto.CoverageEmployeeRow row = coverage.unassignedEmployees().get(0);
        assertEquals("UNASSIGNED", row.assignmentStatus());
        assertNull(row.unassignedReason());
    }

    @Test
    void noMatchingTemplate_showsReason() {
        when(reviewCycleService.getActiveSubmissionCycle()).thenReturn(activeCycle);

        Department dept = department(10L, "Engineering");
        Position pos = position(20L, "Developer");
        Employee emp = employee(1L, "EMP-1", "Alice", dept, pos);

        when(reportingManagerResolver.resolve(emp)).thenReturn(null);
        when(employeeRepository.findEligibleSelfAssessmentAssignees(
                eq(EmployeeStatus.ACTIVE), eq(StaffTypes.PROBATION)))
                .thenReturn(List.of(emp));

        when(formRepository.findByCycleOrderByCreatedDateDesc(activeCycle)).thenReturn(List.of());
        when(templateRepository.findActiveByDepartmentAndPositionAndReviewCycleId(10L, 20L, 1L))
                .thenReturn(Optional.empty());
        when(templateRepository.findActiveByDepartmentAndPositionWithNullReviewCycle(10L, 20L))
                .thenReturn(Optional.empty());

        AssignmentCoverageDto coverage = service.getAssignmentCoverage();

        assertEquals(1, coverage.noTemplateCount());
        AssignmentCoverageDto.CoverageEmployeeRow row = coverage.unassignedEmployees().get(0);
        assertEquals("NO_MATCHING_TEMPLATE", row.unassignedReason());
    }

    @Test
    void employeeWithoutDeptOrPos_showsNoMatchingTemplate() {
        when(reviewCycleService.getActiveSubmissionCycle()).thenReturn(activeCycle);

        Employee emp = employee(1L, "EMP-1", "Alice", null, null);

        when(reportingManagerResolver.resolve(emp)).thenReturn(null);
        when(employeeRepository.findEligibleSelfAssessmentAssignees(
                eq(EmployeeStatus.ACTIVE), eq(StaffTypes.PROBATION)))
                .thenReturn(List.of(emp));

        when(formRepository.findByCycleOrderByCreatedDateDesc(activeCycle)).thenReturn(List.of());

        AssignmentCoverageDto coverage = service.getAssignmentCoverage();

        assertEquals(1, coverage.noTemplateCount());
        assertEquals("NO_MATCHING_TEMPLATE", coverage.unassignedEmployees().get(0).unassignedReason());
    }

    @Test
    void mixedAssignedAndUnassigned_correctCounts() {
        when(reviewCycleService.getActiveSubmissionCycle()).thenReturn(activeCycle);

        Department dept = department(10L, "Engineering");
        Position pos = position(20L, "Developer");
        Employee emp1 = employee(1L, "EMP-1", "Alice", dept, pos);
        Employee emp2 = employee(2L, "EMP-2", "Bob", dept, pos);
        Employee emp3 = employee(3L, "EMP-3", "Carol", dept, pos);

        when(reportingManagerResolver.resolve(any())).thenReturn(null);
        when(employeeRepository.findEligibleSelfAssessmentAssignees(
                eq(EmployeeStatus.ACTIVE), eq(StaffTypes.PROBATION)))
                .thenReturn(List.of(emp1, emp2, emp3));

        SelfAssessmentForm form1 = new SelfAssessmentForm();
        form1.setEmployee(emp1);
        form1.setTemplate(template(100L, "Dev Review", dept, pos));
        form1.setCycle(activeCycle);
        form1.setAssignedAt(Instant.now());

        SelfAssessmentForm form2 = new SelfAssessmentForm();
        form2.setEmployee(emp2);
        form2.setTemplate(template(100L, "Dev Review", dept, pos));
        form2.setCycle(activeCycle);
        form2.setAssignedAt(Instant.now());

        when(formRepository.findByCycleOrderByCreatedDateDesc(activeCycle))
                .thenReturn(List.of(form1, form2));
        when(templateRepository.findActiveByDepartmentAndPositionAndReviewCycleId(10L, 20L, 1L))
                .thenReturn(Optional.of(template(100L, "Dev Review", dept, pos)));

        AssignmentCoverageDto coverage = service.getAssignmentCoverage();

        assertEquals(3, coverage.eligibleCount());
        assertEquals(2, coverage.assignedCount());
        assertEquals(1, coverage.leftToAssignCount());
        assertEquals(0, coverage.noTemplateCount());
        assertEquals(66.67, coverage.coveragePercent());
        assertNotNull(coverage.activeCycle());
    }

    private static Department department(Long id, String name) {
        Department dept = new Department();
        dept.setId(id);
        dept.setName(name);
        return dept;
    }

    private static Position position(Long id, String name) {
        Position pos = new Position();
        pos.setId(id);
        pos.setName(name);
        return pos;
    }

    private static Employee employee(Long id, String code, String name, Department dept, Position pos) {
        Employee emp = new Employee();
        emp.setId(id);
        emp.setEmployeeId(code);
        emp.setEmployeeName(name);
        emp.setDepartment(dept);
        emp.setPosition(pos);
        emp.setEmploymentStatus(EmployeeStatus.ACTIVE);
        return emp;
    }

    private static SelfAssessmentFormTemplate template(Long id, String title, Department dept, Position pos) {
        SelfAssessmentFormTemplate tmpl = new SelfAssessmentFormTemplate();
        tmpl.setId(id);
        tmpl.setTitle(title);
        tmpl.setDepartment(dept);
        tmpl.setPosition(pos);
        tmpl.setActive(true);
        tmpl.setReviewCycle(null);
        return tmpl;
    }
}
