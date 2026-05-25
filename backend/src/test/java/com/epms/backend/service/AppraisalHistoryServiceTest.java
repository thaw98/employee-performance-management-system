package com.epms.backend.service;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.Mockito.when;

import com.epms.backend.StaffTypes;
import com.epms.backend.dto.appraisal.AppraisalHistoryDetailRowDto;
import com.epms.backend.entity.AppraisalAssignment;
import com.epms.backend.entity.AppraisalCycle;
import com.epms.backend.entity.AppraisalStatus;
import com.epms.backend.entity.Department;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.Position;
import com.epms.backend.entity.StaffType;
import com.epms.backend.repository.AppraisalAssignmentRepository;
import com.epms.backend.repository.AppraisalCycleRepository;
import java.io.ByteArrayInputStream;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AppraisalHistoryServiceTest {

    @Mock
    private AppraisalAssignmentRepository assignmentRepository;
    @Mock
    private AppraisalCycleRepository cycleRepository;

    private AppraisalHistoryService service;
    private AppraisalCycle q1;
    private Department engineering;
    private Position developer;

    @BeforeEach
    void setUp() {
        service = new AppraisalHistoryService(assignmentRepository, cycleRepository);
        q1 = cycle(10L, "Q1 2026");
        engineering = department(20L, "Engineering", 200L);
        developer = position(30L, "Developer");
    }

    @Test
    void hrReceivesAllCompletedNonProbationHistoryRows() {
        AppraisalAssignment approved = assignment(1L, q1, employee(100L, "EMP-100", engineering, developer, null, StaffTypes.PERMANENT), null, AppraisalStatus.HR_APPROVED);
        AppraisalAssignment finalized = assignment(2L, q1, employee(101L, "EMP-101", engineering, developer, null, StaffTypes.PERMANENT), null, AppraisalStatus.LOCKED);
        AppraisalAssignment probation = assignment(3L, q1, employee(102L, "EMP-102", engineering, developer, null, StaffTypes.PROBATION), null, AppraisalStatus.LOCKED);
        when(assignmentRepository.findAll()).thenReturn(List.of(approved, finalized, probation));

        List<AppraisalHistoryDetailRowDto> rows = service.getHistory(900L, 1L);

        assertEquals(2, rows.size());
        assertEquals(List.of(1L, 2L), rows.stream().map(AppraisalHistoryDetailRowDto::assignmentId).toList());
    }

    @Test
    void managerReceivesOnlyEvaluatorDirectReportAndManagedDepartmentAssignments() {
        Employee manager = employee(200L, "MGR-1", engineering, developer, null, StaffTypes.PERMANENT);
        AppraisalAssignment evaluatorAssignment = assignment(1L, q1, employee(100L, "EMP-100", department(21L, "Finance", null), developer, null, StaffTypes.PERMANENT), manager, AppraisalStatus.HR_APPROVED);
        AppraisalAssignment directReportAssignment = assignment(2L, q1, employee(101L, "EMP-101", department(22L, "Sales", null), developer, manager, StaffTypes.PERMANENT), null, AppraisalStatus.HR_APPROVED);
        AppraisalAssignment managedDepartmentAssignment = assignment(3L, q1, employee(102L, "EMP-102", engineering, developer, null, StaffTypes.PERMANENT), null, AppraisalStatus.LOCKED);
        AppraisalAssignment outsideAssignment = assignment(4L, q1, employee(103L, "EMP-103", department(23L, "Ops", null), developer, null, StaffTypes.PERMANENT), null, AppraisalStatus.LOCKED);
        when(assignmentRepository.findAll()).thenReturn(List.of(evaluatorAssignment, directReportAssignment, managedDepartmentAssignment, outsideAssignment));

        List<AppraisalHistoryDetailRowDto> rows = service.getHistory(200L, 2L);

        assertEquals(3, rows.size());
    }

    @Test
    void employeeReceivesOnlyOwnCompletedAppraisals() {
        AppraisalAssignment own = assignment(1L, q1, employee(100L, "EMP-100", engineering, developer, null, StaffTypes.PERMANENT), null, AppraisalStatus.HR_APPROVED);
        AppraisalAssignment other = assignment(2L, q1, employee(101L, "EMP-101", engineering, developer, null, StaffTypes.PERMANENT), null, AppraisalStatus.HR_APPROVED);
        when(assignmentRepository.findAll()).thenReturn(List.of(own, other));

        List<AppraisalHistoryDetailRowDto> rows = service.getHistory(100L, 4L);

        assertEquals(1, rows.size());
        assertEquals(100L, rows.get(0).employeeDbId());
    }

    @Test
    void historyIncludesOnlyApprovedAndLockedStatuses() {
        AppraisalAssignment draft = assignment(1L, q1, employee(100L, "EMP-100", engineering, developer, null, StaffTypes.PERMANENT), null, AppraisalStatus.DRAFT);
        AppraisalAssignment submitted = assignment(2L, q1, employee(101L, "EMP-101", engineering, developer, null, StaffTypes.PERMANENT), null, AppraisalStatus.SUBMITTED);
        AppraisalAssignment approved = assignment(3L, q1, employee(102L, "EMP-102", engineering, developer, null, StaffTypes.PERMANENT), null, AppraisalStatus.HR_APPROVED);
        AppraisalAssignment locked = assignment(4L, q1, employee(103L, "EMP-103", engineering, developer, null, StaffTypes.PERMANENT), null, AppraisalStatus.LOCKED);
        when(assignmentRepository.findAll()).thenReturn(List.of(draft, submitted, approved, locked));

        List<AppraisalHistoryDetailRowDto> rows = service.getHistory(900L, 1L);

        assertEquals(2, rows.size());
        assertEquals(List.of("HR Approved", "Finalized"), rows.stream().map(AppraisalHistoryDetailRowDto::statusLabel).toList());
    }

    @Test
    void historyDetailRowsIncludeEmployeeIdentityAndOrgFields() {
        AppraisalAssignment approved = assignment(1L, q1, employee(100L, "EMP-100", engineering, developer, null, StaffTypes.PERMANENT), null, AppraisalStatus.HR_APPROVED);
        when(assignmentRepository.findAll()).thenReturn(List.of(approved));

        List<AppraisalHistoryDetailRowDto> rows = service.getHistory(900L, 1L);

        AppraisalHistoryDetailRowDto row = rows.get(0);
        assertEquals(1L, row.assignmentId());
        assertEquals("EMP-100", row.employeeId());
        assertEquals("EMP-100", row.staffNo());
        assertEquals("EMP-100 Name", row.employeeName());
        assertEquals("Engineering", row.departmentName());
        assertEquals("Developer", row.positionName());
        assertEquals(88.0, row.score());
    }

    @Test
    void excelExportReturnsWorkbookWithExpectedSheetsAndHeaders() throws Exception {
        AppraisalAssignment approved = assignment(1L, q1, employee(100L, "EMP-100", engineering, developer, null, StaffTypes.PERMANENT), null, AppraisalStatus.HR_APPROVED);
        when(cycleRepository.findById(10L)).thenReturn(Optional.of(q1));
        when(assignmentRepository.findAll()).thenReturn(List.of(approved));

        byte[] bytes = service.exportCycleWorkbook(10L, 900L, 1L);

        assertFalse(bytes.length == 0);
        try (Workbook workbook = new XSSFWorkbook(new ByteArrayInputStream(bytes))) {
            assertEquals("Cycle Summary", workbook.getSheetAt(0).getSheetName());
            assertEquals("Employee Details", workbook.getSheetAt(1).getSheetName());
            Row summaryHeader = workbook.getSheet("Cycle Summary").getRow(3);
            Row detailHeader = workbook.getSheet("Employee Details").getRow(0);
            assertArrayEquals(
                    new String[] {"Cycle Name", "Start Date", "End Date", "Department", "Position"},
                    new String[] {
                            summaryHeader.getCell(0).getStringCellValue(),
                            summaryHeader.getCell(1).getStringCellValue(),
                            summaryHeader.getCell(2).getStringCellValue(),
                            summaryHeader.getCell(3).getStringCellValue(),
                            summaryHeader.getCell(4).getStringCellValue()
                    });
            assertEquals("Staff No", detailHeader.getCell(5).getStringCellValue());
            assertEquals("HR Approved Date", detailHeader.getCell(11).getStringCellValue());
        }
    }

    private static AppraisalAssignment assignment(
            Long id,
            AppraisalCycle cycle,
            Employee employee,
            Employee evaluator,
            AppraisalStatus status) {
        AppraisalAssignment assignment = new AppraisalAssignment();
        assignment.setId(id);
        assignment.setPeriod(cycle);
        assignment.setEmployee(employee);
        assignment.setEvaluator(evaluator);
        assignment.setStatus(status);
        assignment.setTotalScore(88.0);
        assignment.setRatingCategory("GOOD");
        assignment.setSubmittedAt(Instant.parse("2026-02-10T10:00:00Z"));
        assignment.setHrSignedAt(Instant.parse("2026-02-11T10:00:00Z"));
        assignment.setUpdatedAt(Instant.parse("2026-02-12T10:00:00Z"));
        return assignment;
    }

    private static Employee employee(Long id, String staffNo, Department department, Position position, Employee manager, long staffTypeId) {
        Employee employee = new Employee();
        employee.setId(id);
        employee.setEmployeeId(staffNo);
        employee.setEmployeeName(staffNo + " Name");
        employee.setDepartment(department);
        employee.setPosition(position);
        employee.setManager(manager);
        StaffType staffType = new StaffType();
        staffType.setId(staffTypeId);
        employee.setStaffType(staffType);
        return employee;
    }

    private static AppraisalCycle cycle(Long id, String name) {
        AppraisalCycle cycle = new AppraisalCycle();
        cycle.setId(id);
        cycle.setName(name);
        cycle.setStartDate(LocalDate.of(2026, 1, 1));
        cycle.setEndDate(LocalDate.of(2026, 3, 31));
        return cycle;
    }

    private static Department department(Long id, String name, Long managerId) {
        Department department = new Department();
        department.setId(id);
        department.setName(name);
        department.setManagerId(managerId);
        return department;
    }

    private static Position position(Long id, String name) {
        Position position = new Position();
        position.setId(id);
        position.setName(name);
        return position;
    }
}
