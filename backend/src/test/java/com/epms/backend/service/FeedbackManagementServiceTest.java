package com.epms.backend.service;

import com.epms.backend.dto.feedbackmanagement.FeedbackCoverageDto;
import com.epms.backend.dto.feedbackmanagement.FeedbackCoverageDto.CoverageEmployeeRow;
import com.epms.backend.entity.*;
import com.epms.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FeedbackManagementServiceTest {

    @Mock
    private FeedbackTemplateConfigRepository templateRepository;
    @Mock
    private FeedbackLimitConfigRepository limitRepository;
    @Mock
    private ReviewCycleRepository reviewCycleRepository;
    @Mock
    private CriteriaRepository criteriaRepository;
    @Mock
    private EmployeeRepository employeeRepository;

    private FeedbackManagementService service;

    private ReviewCycle q12026;
    private ReviewCycle q22026;
    private ReviewCycle q12027;
    private Employee alice;
    private Employee bob;
    private Department dept;
    private Position pos;
    private LevelCode levelCode;

    @BeforeEach
    void setUp() {
        service = new FeedbackManagementService(
                templateRepository, limitRepository, reviewCycleRepository,
                criteriaRepository, employeeRepository);

        levelCode = new LevelCode();
        levelCode.setId(1L);
        levelCode.setCode("L1");

        pos = new Position();
        pos.setId(10L);
        pos.setCode("DEV");
        pos.setName("Developer");
        pos.setLevelCode(levelCode);

        dept = new Department();
        dept.setId(100L);
        dept.setName("Engineering");
        dept.setStatus("Active");

        q12026 = new ReviewCycle();
        q12026.setId(1L);
        q12026.setName("Q1 2026");
        q12026.setCode("Q-2026-1");
        q12026.setCycleType(ReviewCycle.CycleType.QUARTERLY);
        q12026.setSequenceNo(1);
        q12026.setYearLabel("2026-2027");
        q12026.setStartDate(LocalDate.of(2026, 4, 1));
        q12026.setEndDate(LocalDate.of(2026, 6, 30));

        q22026 = new ReviewCycle();
        q22026.setId(2L);
        q22026.setName("Q2 2026");
        q22026.setCode("Q-2026-2");
        q22026.setCycleType(ReviewCycle.CycleType.QUARTERLY);
        q22026.setSequenceNo(2);
        q22026.setYearLabel("2026-2027");
        q22026.setStartDate(LocalDate.of(2026, 7, 1));
        q22026.setEndDate(LocalDate.of(2026, 9, 30));

        q12027 = new ReviewCycle();
        q12027.setId(3L);
        q12027.setName("Q1 2027");
        q12027.setCode("Q-2027-1");
        q12027.setCycleType(ReviewCycle.CycleType.QUARTERLY);
        q12027.setSequenceNo(1);
        q12027.setYearLabel("2027-2028");
        q12027.setStartDate(LocalDate.of(2027, 4, 1));
        q12027.setEndDate(LocalDate.of(2027, 6, 30));

        alice = new Employee();
        alice.setId(1L);
        alice.setEmployeeId("EMP-001");
        alice.setEmployeeName("Alice");
        alice.setDepartment(dept);
        alice.setPosition(pos);
        alice.setEmploymentStatus(EmployeeStatus.ACTIVE);

        bob = new Employee();
        bob.setId(2L);
        bob.setEmployeeId("EMP-002");
        bob.setEmployeeName("Bob");
        bob.setDepartment(dept);
        bob.setPosition(pos);
        bob.setEmploymentStatus(EmployeeStatus.ACTIVE);
    }

    @Test
    void q1_2026_returnsAllEligibleCoveredEvenWithoutTemplates() {
        when(reviewCycleRepository.findById(1L)).thenReturn(Optional.of(q12026));
        when(employeeRepository.findAllActiveWithUserAccount()).thenReturn(List.of(alice, bob));

        FeedbackCoverageDto result = service.getCoverage(1L);

        assertEquals(2, result.eligibleCount());
        assertEquals(2, result.coveredCount());
        assertEquals(0, result.uncoveredCount());
        assertEquals(100.0, result.coveragePercent(), 0.001);
        assertEquals(2, result.coveredEmployees().size());
        assertTrue(result.uncoveredEmployees().isEmpty());
    }

    @Test
    void q1_2026_semiAnnual_returnsAllEligibleCoveredEvenWithoutTemplates() {
        ReviewCycle semiAnnualQ1 = new ReviewCycle();
        semiAnnualQ1.setId(4L);
        semiAnnualQ1.setName("Q1 2026-2027");
        semiAnnualQ1.setCode("H-2026-2027-1");
        semiAnnualQ1.setCycleType(ReviewCycle.CycleType.SEMI_ANNUAL);
        semiAnnualQ1.setSequenceNo(1);
        semiAnnualQ1.setYearLabel("2026-2027");
        semiAnnualQ1.setStartDate(LocalDate.of(2026, 4, 1));
        semiAnnualQ1.setEndDate(LocalDate.of(2026, 9, 30));

        when(reviewCycleRepository.findById(4L)).thenReturn(Optional.of(semiAnnualQ1));
        when(employeeRepository.findAllActiveWithUserAccount()).thenReturn(List.of(alice, bob));

        FeedbackCoverageDto result = service.getCoverage(4L);

        assertEquals(2, result.eligibleCount());
        assertEquals(2, result.coveredCount());
        assertEquals(0, result.uncoveredCount());
        assertEquals(100.0, result.coveragePercent(), 0.001);
        assertEquals(2, result.coveredEmployees().size());
        assertTrue(result.uncoveredEmployees().isEmpty());
    }

    @Test
    void q1_2026_noEligibleEmployees_returnsZeroPercent() {
        when(reviewCycleRepository.findById(1L)).thenReturn(Optional.of(q12026));
        when(employeeRepository.findAllActiveWithUserAccount()).thenReturn(List.of());

        FeedbackCoverageDto result = service.getCoverage(1L);

        assertEquals(0, result.eligibleCount());
        assertEquals(0, result.coveredCount());
        assertEquals(0, result.uncoveredCount());
        assertEquals(0.0, result.coveragePercent(), 0.001);
        assertTrue(result.coveredEmployees().isEmpty());
        assertTrue(result.uncoveredEmployees().isEmpty());
    }

    @Test
    void nonQ1_2026_usesNormalTemplateMatching() {
        when(reviewCycleRepository.findById(2L)).thenReturn(Optional.of(q22026));
        when(employeeRepository.findAllActiveWithUserAccount()).thenReturn(List.of(alice, bob));
        when(templateRepository.findByReviewCycleId(2L)).thenReturn(List.of());

        FeedbackCoverageDto result = service.getCoverage(2L);

        assertEquals(2, result.eligibleCount());
        assertEquals(0, result.coveredCount());
        assertEquals(2, result.uncoveredCount());
        assertTrue(result.coveredEmployees().isEmpty());
        assertEquals(2, result.uncoveredEmployees().size());
    }

    @Test
    void q1_2027_doesNotGetOverride() {
        when(reviewCycleRepository.findById(3L)).thenReturn(Optional.of(q12027));
        when(employeeRepository.findAllActiveWithUserAccount()).thenReturn(List.of(alice, bob));
        when(templateRepository.findByReviewCycleId(3L)).thenReturn(List.of());

        FeedbackCoverageDto result = service.getCoverage(3L);

        assertEquals(2, result.eligibleCount());
        assertEquals(0, result.coveredCount());
        assertEquals(2, result.uncoveredCount());
        assertTrue(result.coveredEmployees().isEmpty());
        assertEquals(2, result.uncoveredEmployees().size());
    }

    @Test
    void nullReviewCycleId_returnsEmpty() {
        FeedbackCoverageDto result = service.getCoverage(null);

        assertEquals(0, result.eligibleCount());
        assertEquals(0, result.coveredCount());
        assertTrue(result.coveredEmployees().isEmpty());
        assertTrue(result.uncoveredEmployees().isEmpty());
    }

    @Test
    void nonexistentReviewCycleId_returnsEmpty() {
        when(reviewCycleRepository.findById(999L)).thenReturn(Optional.empty());

        FeedbackCoverageDto result = service.getCoverage(999L);

        assertEquals(0, result.eligibleCount());
        assertEquals(0, result.coveredCount());
        assertTrue(result.coveredEmployees().isEmpty());
        assertTrue(result.uncoveredEmployees().isEmpty());
    }
}
