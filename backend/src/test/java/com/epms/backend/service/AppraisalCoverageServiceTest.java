package com.epms.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.Mockito.when;

import com.epms.backend.dto.appraisal.AppraisalCoverageDto;
import com.epms.backend.entity.*;
import com.epms.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@ExtendWith(MockitoExtension.class)
class AppraisalCoverageServiceTest {

    @Mock
    private AppraisalCategoryRepository categoryRepository;
    @Mock
    private AppraisalQuestionRepository questionRepository;
    @Mock
    private AppraisalTemplateRepository templateRepository;
    @Mock
    private DepartmentPositionRepository departmentPositionRepository;
    @Mock
    private AppraisalAssignmentRepository assignmentRepository;
    @Mock
    private EmployeeReportingHistoryRepository reportingHistoryRepository;
    @Mock
    private AppraisalCycleRepository appraisalCycleRepository;
    @Mock
    private ReviewCycleRepository reviewCycleRepository;
    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private DepartmentRepository departmentRepository;

    private AppraisalService appraisalService;

    private ReviewCycle cycle;
    private Department dept;
    private Position pos;
    private Position otherPos;
    private LevelCode levelCode;
    private DepartmentPosition dp;
    private Employee departmentHead;
    private AppraisalTemplate template;

    @BeforeEach
    void setUp() {
        appraisalService = new AppraisalService(
                categoryRepository, questionRepository, templateRepository,
                departmentPositionRepository, assignmentRepository,
                reportingHistoryRepository, appraisalCycleRepository,
                reviewCycleRepository, employeeRepository,
                departmentRepository,
                notificationService, userRepository
        );

        levelCode = new LevelCode();
        levelCode.setId(1L);
        levelCode.setCode("L1");
        levelCode.setDescription("Level 1");

        cycle = new ReviewCycle();
        cycle.setId(100L);
        cycle.setName("Q1 2026");

        dept = new Department();
        dept.setId(10L);
        dept.setName("Engineering");
        dept.setStatus("Active");
        dept.setManagerId(50L);

        pos = new Position();
        pos.setId(20L);
        pos.setCode("DEV");
        pos.setName("Developer");
        pos.setLevelCode(levelCode);
        pos.setStatus("Active");

        otherPos = new Position();
        otherPos.setId(30L);
        otherPos.setCode("QA");
        otherPos.setName("QA Tester");
        otherPos.setLevelCode(levelCode);
        otherPos.setStatus("Active");

        dp = new DepartmentPosition();
        dp.setId(1L);
        dp.setDepartment(dept);
        dp.setPosition(pos);
        dp.setStatus("active");

        departmentHead = new Employee();
        departmentHead.setId(50L);
        departmentHead.setEmployeeName("Alice Manager");
        departmentHead.setDepartment(dept);
        departmentHead.setPosition(pos);
        departmentHead.setEmploymentStatus(EmployeeStatus.ACTIVE);

        template = new AppraisalTemplate();
        template.setId(1L);
        template.setName("Appraisal Q1");
        template.setReviewCycleId(100L);
        template.setTargetDepartmentPositions(List.of(dp));
    }

    @Test
    void pairWithActiveNonHeadEmployeeAndNoCycleTemplate_isMissing() {
        when(reviewCycleRepository.findById(100L)).thenReturn(Optional.of(cycle));
        when(departmentPositionRepository.findAllActiveWithPosition()).thenReturn(List.of(dp));
        when(employeeRepository.countActiveEmployeesPerDepartmentAndPosition())
                .thenReturn(listOfObjectArrays(new Object[]{10L, 20L, 2L}));
        when(departmentRepository.findAll()).thenReturn(List.of(dept));
        when(employeeRepository.findBasicInfoByIds(anySet()))
                .thenReturn(listOfObjectArrays(new Object[]{50L, 10L, 20L}));
        when(templateRepository.findByReviewCycleIdWithPositions(100L)).thenReturn(List.of());

        AppraisalCoverageDto result = appraisalService.getCoverage(100L);

        assertEquals(1, result.totalEligiblePairs());
        assertEquals(0, result.coveredPairs());
        assertEquals(1, result.missingPairsCount());
        assertEquals(1, result.missingPairs().size());
        assertEquals("Developer", result.missingPairs().get(0).positionName());
    }

    @Test
    void pairTargetedByTemplateForSelectedCycle_isCovered() {
        when(reviewCycleRepository.findById(100L)).thenReturn(Optional.of(cycle));
        when(departmentPositionRepository.findAllActiveWithPosition()).thenReturn(List.of(dp));
        when(employeeRepository.countActiveEmployeesPerDepartmentAndPosition())
                .thenReturn(listOfObjectArrays(new Object[]{10L, 20L, 2L}));
        when(departmentRepository.findAll()).thenReturn(List.of(dept));
        when(employeeRepository.findBasicInfoByIds(anySet()))
                .thenReturn(listOfObjectArrays(new Object[]{50L, 10L, 20L}));
        when(templateRepository.findByReviewCycleIdWithPositions(100L)).thenReturn(List.of(template));

        AppraisalCoverageDto result = appraisalService.getCoverage(100L);

        assertEquals(1, result.totalEligiblePairs());
        assertEquals(1, result.coveredPairs());
        assertEquals(0, result.missingPairsCount());
        assertTrue(result.missingPairs().isEmpty());
    }

    @Test
    void multiTargetTemplate_coversAllTargetedPairs() {
        DepartmentPosition dp2 = new DepartmentPosition();
        dp2.setId(3L);
        dp2.setDepartment(dept);
        dp2.setPosition(otherPos);
        dp2.setStatus("active");

        template.setTargetDepartmentPositions(List.of(dp, dp2));

        when(reviewCycleRepository.findById(100L)).thenReturn(Optional.of(cycle));
        when(departmentPositionRepository.findAllActiveWithPosition()).thenReturn(List.of(dp, dp2));
        when(employeeRepository.countActiveEmployeesPerDepartmentAndPosition())
                .thenReturn(listOfObjectArrays(new Object[]{10L, 20L, 2L}, new Object[]{10L, 30L, 1L}));
        when(departmentRepository.findAll()).thenReturn(List.of(dept));
        when(employeeRepository.findBasicInfoByIds(anySet()))
                .thenReturn(listOfObjectArrays(new Object[]{50L, 10L, 20L}));
        when(templateRepository.findByReviewCycleIdWithPositions(100L)).thenReturn(List.of(template));

        AppraisalCoverageDto result = appraisalService.getCoverage(100L);

        assertEquals(2, result.totalEligiblePairs());
        assertEquals(2, result.coveredPairs());
        assertEquals(0, result.missingPairsCount());
    }

    @Test
    void pairWithOnlyDepartmentHead_isNotEligible() {
        when(reviewCycleRepository.findById(100L)).thenReturn(Optional.of(cycle));
        when(departmentPositionRepository.findAllActiveWithPosition()).thenReturn(List.of(dp));
        when(employeeRepository.countActiveEmployeesPerDepartmentAndPosition())
                .thenReturn(listOfObjectArrays(new Object[]{10L, 20L, 1L}));
        when(departmentRepository.findAll()).thenReturn(List.of(dept));
        when(employeeRepository.findBasicInfoByIds(anySet()))
                .thenReturn(listOfObjectArrays(new Object[]{50L, 10L, 20L}));
        when(templateRepository.findByReviewCycleIdWithPositions(100L)).thenReturn(List.of());

        AppraisalCoverageDto result = appraisalService.getCoverage(100L);

        assertEquals(0, result.totalEligiblePairs());
        assertEquals(0, result.coveredPairs());
        assertEquals(0, result.missingPairsCount());
    }

    @Test
    void templatesFromOtherReviewCycles_doNotCount() {
        when(reviewCycleRepository.findById(100L)).thenReturn(Optional.of(cycle));
        when(departmentPositionRepository.findAllActiveWithPosition()).thenReturn(List.of(dp));
        when(employeeRepository.countActiveEmployeesPerDepartmentAndPosition())
                .thenReturn(listOfObjectArrays(new Object[]{10L, 20L, 2L}));
        when(departmentRepository.findAll()).thenReturn(List.of(dept));
        when(employeeRepository.findBasicInfoByIds(anySet()))
                .thenReturn(listOfObjectArrays(new Object[]{50L, 10L, 20L}));
        when(templateRepository.findByReviewCycleIdWithPositions(100L)).thenReturn(List.of());

        AppraisalCoverageDto result = appraisalService.getCoverage(100L);

        assertEquals(1, result.missingPairsCount());
    }

    @Test
    void nullReviewCycleId_returnsEmpty() {
        AppraisalCoverageDto result = appraisalService.getCoverage(null);

        assertEquals(0, result.totalEligiblePairs());
        assertTrue(result.missingPairs().isEmpty());
    }

    @Test
    void nonexistentReviewCycle_returnsEmpty() {
        when(reviewCycleRepository.findById(999L)).thenReturn(Optional.empty());

        AppraisalCoverageDto result = appraisalService.getCoverage(999L);

        assertEquals(0, result.totalEligiblePairs());
        assertTrue(result.missingPairs().isEmpty());
    }

    private static List<Object[]> listOfObjectArrays(Object[]... arrays) {
        List<Object[]> result = new ArrayList<>();
        for (Object[] arr : arrays) {
            result.add(arr);
        }
        return result;
    }
}
