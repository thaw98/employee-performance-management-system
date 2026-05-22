package com.epms.backend.service;

import com.epms.backend.dto.selfassessmentform.EmployeeInfoDto;
import com.epms.backend.dto.selfassessmentform.ScoreRecordDto;
import com.epms.backend.dto.selfassessmentform.report.SelfAssessmentAnalyticsReportDto;
import com.epms.backend.dto.selfassessmentform.report.SelfAssessmentSummaryReportData;
import com.epms.backend.entity.Department;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.ReviewCycle;
import com.epms.backend.repository.ReviewCycleRepository;
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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SelfAssessmentReportServiceTest {

    @Mock
    private SelfAssessmentFormService formService;
    @Mock
    private ReviewCycleRepository reviewCycleRepository;

    private SelfAssessmentReportService reportService;

    @BeforeEach
    void setUp() {
        reportService = new SelfAssessmentReportService(formService, reviewCycleRepository);
    }

    @Test
    void getSummaryReportData_filtersToSelectedCycleOnly() {
        Employee employee = new Employee();
        ReviewCycle cycle = cycle(7L, "Q2 2026");
        when(reviewCycleRepository.findById(7L)).thenReturn(Optional.of(cycle));
        when(formService.getScoreRecords(employee, 1L)).thenReturn(List.of(
                record(1L, 7L, "Q2 2026", 90.0),
                record(2L, 8L, "Q3 2026", 70.0),
                record(3L, 7L, "Q2 2026", null)
        ));

        SelfAssessmentSummaryReportData data = reportService.getSummaryReportData(employee, 1L, 7L);

        assertEquals(2, data.totalRecords());
        assertEquals(2, data.rows().size());
        assertTrue(data.rows().stream().allMatch(row -> !"Employee 2".equals(row.getEmployeeName())));
    }

    @Test
    void getSummaryReportData_roleFourUsesEmployeeScopedRecords() {
        Employee employee = new Employee();
        ReviewCycle cycle = cycle(7L, "Q2 2026");
        when(reviewCycleRepository.findById(7L)).thenReturn(Optional.of(cycle));
        when(formService.getScoreRecords(employee, 4L)).thenReturn(List.of(record(1L, 7L, "Q2 2026", 88.0)));

        SelfAssessmentSummaryReportData data = reportService.getSummaryReportData(employee, 4L, 7L);

        assertEquals(1, data.totalRecords());
        assertEquals("Employee 1", data.rows().get(0).getEmployeeName());
    }

    @Test
    void getSummaryReportData_summaryScoresExcludeNullScores() {
        Employee employee = new Employee();
        ReviewCycle cycle = cycle(7L, "Q2 2026");
        when(reviewCycleRepository.findById(7L)).thenReturn(Optional.of(cycle));
        when(formService.getScoreRecords(employee, 1L)).thenReturn(List.of(
                record(1L, 7L, "Q2 2026", 90.0),
                record(2L, 7L, "Q2 2026", null),
                record(3L, 7L, "Q2 2026", 60.0)
        ));

        SelfAssessmentSummaryReportData data = reportService.getSummaryReportData(employee, 1L, 7L);

        assertEquals("75.0", data.averageScore());
        assertEquals("90.0", data.highestScore());
        assertEquals("60.0", data.lowestScore());
        assertEquals("", data.rows().get(1).getScorePercentage());
    }

    @Test
    void getSummaryReportData_missingCycleThrowsBadRequestException() {
        Employee employee = new Employee();

        assertThrows(IllegalArgumentException.class, () -> reportService.getSummaryReportData(employee, 1L, null));
        assertThrows(IllegalArgumentException.class, () -> reportService.getSummaryReportData(employee, 1L, 0L));
    }

    @Test
    void getSummaryReportData_unknownCycleThrowsBadRequestException() {
        Employee employee = new Employee();
        when(reviewCycleRepository.findById(99L)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> reportService.getSummaryReportData(employee, 1L, 99L));

        assertEquals("Unknown review cycle", ex.getMessage());
    }

    @Test
    void getAnalyticsReportData_hrAggregatesDepartmentsAndTreatsNotSubmittedAsZero() {
        Employee employee = new Employee();
        ReviewCycle cycle = cycle(7L, "Q2 2026");
        when(reviewCycleRepository.findById(7L)).thenReturn(Optional.of(cycle));
        when(reviewCycleRepository.findAll()).thenReturn(List.of(cycle));
        when(formService.getScoreRecords(employee, 1L)).thenReturn(List.of(
                record(1L, 7L, "Q2 2026", 90.0, "Engineering", "Developer", "FINALIZED_LOCKED"),
                record(2L, 7L, "Q2 2026", null, "Engineering", "Developer", "NOT_SUBMITTED"),
                record(3L, 7L, "Q2 2026", 60.0, "Finance", "Analyst", "FINALIZED_LOCKED")
        ));

        SelfAssessmentAnalyticsReportDto data = reportService.getAnalyticsReportData(employee, 1L, 7L);

        assertEquals(3, data.overallTotals().recordCount());
        assertEquals(50.0, data.overallTotals().averageScore());
        assertEquals(1, data.overallTotals().missedCount());
        assertEquals("Finance", data.highestDepartment().groupName());
        assertEquals("Engineering", data.lowestDepartment().groupName());
        assertEquals(1, data.performanceBandRadar().stream()
                .filter(row -> "Engineering".equals(row.groupName()))
                .findFirst()
                .orElseThrow()
                .unsatisfactory());
    }

    @Test
    void getAnalyticsReportData_returnsAllHighestAndLowestTies() {
        Employee employee = new Employee();
        ReviewCycle cycle = cycle(7L, "Q2 2026");
        when(reviewCycleRepository.findById(7L)).thenReturn(Optional.of(cycle));
        when(reviewCycleRepository.findAll()).thenReturn(List.of(cycle));
        when(formService.getScoreRecords(employee, 1L)).thenReturn(List.of(
                record(1L, 7L, "Q2 2026", 90.0, "Engineering", "Developer", "FINALIZED_LOCKED"),
                record(2L, 7L, "Q2 2026", 90.0, "Engineering", "Developer", "FINALIZED_LOCKED"),
                record(3L, 7L, "Q2 2026", 40.0, "Engineering", "Analyst", "FINALIZED_LOCKED"),
                record(4L, 7L, "Q2 2026", 40.0, "Engineering", "Analyst", "FINALIZED_LOCKED")
        ));

        SelfAssessmentAnalyticsReportDto.PerformerHighlight highlight = reportService
                .getAnalyticsReportData(employee, 1L, 7L)
                .performerHighlights()
                .get(0);

        assertEquals(2, highlight.highestPerformers().size());
        assertEquals(2, highlight.lowestPerformers().size());
    }

    @Test
    void getAnalyticsReportData_managerScopesToCurrentDepartmentAndCalculatesDelta() {
        Department department = new Department();
        department.setId(10L);
        department.setName("Engineering");
        Employee manager = new Employee();
        manager.setDepartment(department);
        ReviewCycle previous = cycle(6L, "Q1 2026");
        previous.setStartDate(LocalDate.of(2026, 1, 1));
        previous.setEndDate(LocalDate.of(2026, 3, 31));
        ReviewCycle selected = cycle(7L, "Q2 2026");
        selected.setStartDate(LocalDate.of(2026, 4, 1));
        selected.setEndDate(LocalDate.of(2026, 6, 30));
        when(reviewCycleRepository.findById(7L)).thenReturn(Optional.of(selected));
        when(reviewCycleRepository.findAll()).thenReturn(List.of(previous, selected));
        when(formService.getScoreRecords(manager, 2L)).thenReturn(List.of(
                record(1L, 7L, "Q2 2026", 90.0, "Engineering", "Developer", "FINALIZED_LOCKED"),
                record(2L, 7L, "Q2 2026", 80.0, "Finance", "Analyst", "FINALIZED_LOCKED"),
                record(1L, 6L, "Q1 2026", 70.0, "Engineering", "Developer", "FINALIZED_LOCKED")
        ));

        SelfAssessmentAnalyticsReportDto data = reportService.getAnalyticsReportData(manager, 2L, 7L);

        assertEquals(1, data.employeeDirectory().size());
        assertEquals("Developer", data.positionSummaries().get(0).groupName());
        assertEquals(20.0, data.employeeDirectory().get(0).previousCycleDelta());
        assertEquals(6L, data.previousCycle().id());
    }

    private static ReviewCycle cycle(Long id, String name) {
        ReviewCycle cycle = new ReviewCycle();
        cycle.setId(id);
        cycle.setName(name);
        cycle.setCode(name.replace(' ', '-'));
        cycle.setStartDate(LocalDate.of(2026, 5, 1));
        cycle.setEndDate(LocalDate.of(2026, 5, 31));
        cycle.setRequiresEmployeeSubmission(true);
        return cycle;
    }

    private static ScoreRecordDto record(Long id, Long cycleId, String cycleName, Double score) {
        return record(id, cycleId, cycleName, score, "Engineering", "Developer", "FINALIZED_LOCKED");
    }

    private static ScoreRecordDto record(
            Long id,
            Long cycleId,
            String cycleName,
            Double score,
            String departmentName,
            String positionName,
            String status) {
        return new ScoreRecordDto(
                id,
                new EmployeeInfoDto(
                        id,
                        "EMP-" + id,
                        "Employee " + id,
                        "employee" + id + "@example.com",
                        "Engineering".equals(departmentName) ? 10L : 11L,
                        departmentName,
                        departmentName.substring(0, Math.min(3, departmentName.length())).toUpperCase(),
                        20L,
                        positionName,
                        positionName.substring(0, Math.min(3, positionName.length())).toUpperCase(),
                        3L),
                status,
                score,
                score == null ? null : score >= 86 ? "Outstanding" : score >= 71 ? "Good" : score >= 60 ? "Meet Requirement" : score >= 40 ? "Need Improvement" : "Unsatisfactory",
                cycleId,
                cycleName,
                Instant.parse("2026-05-02T00:00:00Z"),
                Instant.parse("2026-05-01T00:00:00Z"),
                Instant.parse("2026-05-05T00:00:00Z"));
    }
}
