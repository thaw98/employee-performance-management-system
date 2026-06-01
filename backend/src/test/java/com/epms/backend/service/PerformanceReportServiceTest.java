package com.epms.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import com.epms.backend.dto.PerformanceReportSummaryDto;
import com.epms.backend.dto.PerformanceReportTransferLogDto;
import com.epms.backend.entity.Department;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.EmployeeDepartmentHistory;
import com.epms.backend.entity.EmployeeKpi;
import com.epms.backend.entity.EmployeeStatus;
import com.epms.backend.entity.Position;
import com.epms.backend.entity.PromotionProposal;
import com.epms.backend.entity.PromotionProposalStatus;
import com.epms.backend.entity.TransferType;
import com.epms.backend.entity.User;
import com.epms.backend.repository.AppraisalAssignmentRepository;
import com.epms.backend.repository.EmployeeDepartmentHistoryRepository;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.FeedbackRepository;
import com.epms.backend.repository.KpiRepository;
import com.epms.backend.repository.PipRepository;
import com.epms.backend.repository.PromotionProposalRepository;
import com.epms.backend.repository.SelfAssessmentFormRepository;

class PerformanceReportServiceTest {

    private EmployeeRepository employeeRepository;
    private KpiRepository kpiRepository;
    private AppraisalAssignmentRepository appraisalRepository;
    private SelfAssessmentFormRepository selfAssessmentRepository;
    private FeedbackRepository feedbackRepository;
    private PipRepository pipRepository;
    private PromotionProposalRepository promotionProposalRepository;
    private EmployeeDepartmentHistoryRepository employeeDepartmentHistoryRepository;
    private ProfilePictureStorageService profilePictureStorageService;
    private PerformanceReportService service;

    private Employee employee;
    private User userAccount;

    @BeforeEach
    void setUp() {
        employeeRepository = mock(EmployeeRepository.class);
        kpiRepository = mock(KpiRepository.class);
        appraisalRepository = mock(AppraisalAssignmentRepository.class);
        selfAssessmentRepository = mock(SelfAssessmentFormRepository.class);
        feedbackRepository = mock(FeedbackRepository.class);
        pipRepository = mock(PipRepository.class);
        promotionProposalRepository = mock(PromotionProposalRepository.class);
        employeeDepartmentHistoryRepository = mock(EmployeeDepartmentHistoryRepository.class);
        profilePictureStorageService = mock(ProfilePictureStorageService.class);

        service = new PerformanceReportService(
                employeeRepository, kpiRepository, appraisalRepository,
                selfAssessmentRepository, feedbackRepository, pipRepository,
                promotionProposalRepository, employeeDepartmentHistoryRepository,
                profilePictureStorageService);

        userAccount = new User();
        userAccount.setId(1L);
        userAccount.setCreatedDate(java.time.Instant.parse("2024-01-15T10:00:00Z"));

        Department dept = new Department();
        dept.setId(1L);
        dept.setName("Engineering");

        Position pos = new Position();
        pos.setId(1L);
        pos.setName("Senior Developer");

        employee = new Employee();
        employee.setId(100L);
        employee.setEmployeeId("EMP001");
        employee.setEmployeeName("John Doe");
        employee.setDepartment(dept);
        employee.setPosition(pos);
        employee.setEmploymentStatus(EmployeeStatus.ACTIVE);
        employee.setUserAccount(userAccount);
    }

    @Test
    void testPromotedEmployee_IncludesApprovedTimestampReasonPreviousPositionAndTransferLogs() {
        when(employeeRepository.findById(100L)).thenReturn(Optional.of(employee));
        when(kpiRepository.findLatestPeriodByEmployee_Id(100L)).thenReturn(Optional.empty());
        when(appraisalRepository.findByEmployeeId(100L)).thenReturn(List.of());
        when(selfAssessmentRepository.findByEmployee(employee)).thenReturn(List.of());
        when(feedbackRepository.findByEvaluateeId(eq(100L), any())).thenReturn(org.springframework.data.domain.Page.empty());
        when(pipRepository.existsByEmployeeAndStatusIn(employee, List.of("ACTIVE", "REOPEN_REQUESTED"))).thenReturn(false);
        when(pipRepository.findByEmployee(employee)).thenReturn(List.of());
        when(promotionProposalRepository.existsByEmployeeIdAndStatusIn(100L, List.of(PromotionProposalStatus.PENDING))).thenReturn(false);
        when(promotionProposalRepository.existsByEmployeeIdAndStatusIn(100L, List.of(PromotionProposalStatus.APPROVED))).thenReturn(true);
        when(profilePictureStorageService.toPublicUrl(any())).thenReturn(null);

        // Approved promotion proposal
        PromotionProposal proposal = new PromotionProposal();
        proposal.setId(1L);
        proposal.setRemarks("Excellent performance");
        proposal.setEffectiveDate(LocalDate.of(2025, 6, 1));
        Position targetPos = new Position();
        targetPos.setId(2L);
        targetPos.setName("Tech Lead");
        proposal.setTargetPosition(targetPos);
        proposal.setUpdatedAt(LocalDateTime.of(2025, 5, 15, 14, 30, 0));
        when(promotionProposalRepository.findLatestApprovedByEmployee(100L)).thenReturn(List.of(proposal));

        // PROMOTION history row for previous position
        Position fromPos = new Position();
        fromPos.setId(1L);
        fromPos.setName("Junior Developer");
        EmployeeDepartmentHistory promotionHistory = new EmployeeDepartmentHistory();
        promotionHistory.setId(10L);
        promotionHistory.setFromPosition(fromPos);
        promotionHistory.setTransferType(TransferType.PROMOTION);
        when(employeeDepartmentHistoryRepository
                .findFirstByEmployee_IdAndTransferTypeOrderByEffectiveStartDateDesc(100L, TransferType.PROMOTION))
                .thenReturn(Optional.of(promotionHistory));

        // Transfer logs - TEMPORARY and PERMANENT_TRANSFER
        Department fromDept = new Department();
        fromDept.setId(1L);
        fromDept.setName("Engineering");
        Department toDept = new Department();
        toDept.setId(2L);
        toDept.setName("Marketing");
        Position fromPos2 = new Position();
        fromPos2.setId(1L);
        fromPos2.setName("Senior Developer");
        Position toPos2 = new Position();
        toPos2.setId(2L);
        toPos2.setName("Marketing Lead");

        EmployeeDepartmentHistory tempTransfer = new EmployeeDepartmentHistory();
        tempTransfer.setId(20L);
        tempTransfer.setTransferType(TransferType.TEMPORARY);
        tempTransfer.setFromDepartment(fromDept);
        tempTransfer.setToDepartment(toDept);
        tempTransfer.setFromPosition(fromPos2);
        tempTransfer.setToPosition(toPos2);
        tempTransfer.setEffectiveStartDate(LocalDate.of(2025, 3, 1));
        tempTransfer.setEffectiveEndDate(LocalDate.of(2025, 6, 1));
        tempTransfer.setCurrent(false);
        tempTransfer.setReason("Project need");
        tempTransfer.setRemarks("Temporary assignment");

        EmployeeDepartmentHistory permTransfer = new EmployeeDepartmentHistory();
        permTransfer.setId(21L);
        permTransfer.setTransferType(TransferType.PERMANENT_TRANSFER);
        permTransfer.setFromDepartment(fromDept);
        permTransfer.setToDepartment(toDept);
        permTransfer.setFromPosition(fromPos2);
        permTransfer.setToPosition(toPos2);
        permTransfer.setEffectiveStartDate(LocalDate.of(2025, 7, 1));
        permTransfer.setEffectiveEndDate(null);
        permTransfer.setCurrent(true);
        permTransfer.setReason("Department restructuring");
        permTransfer.setRemarks("Permanent move");

        when(employeeDepartmentHistoryRepository
                .findByEmployee_IdAndTransferTypeInOrderByEffectiveStartDateDesc(100L,
                        List.of(TransferType.TEMPORARY, TransferType.PERMANENT_TRANSFER)))
                .thenReturn(List.of(permTransfer, tempTransfer));

        PerformanceReportSummaryDto result = service.getEmployeeReportSummary(100L);

        assertNotNull(result);
        assertEquals("Excellent performance", result.getLatestApprovedPromotionReason());
        assertEquals("2025-06-01", result.getLatestApprovedPromotionEffectiveDate());
        assertEquals("Tech Lead", result.getLatestApprovedPromotionTargetPositionName());
        assertEquals("2025-05-15T14:30", result.getLatestApprovedPromotionApprovedAt());
        assertEquals("Junior Developer", result.getLatestApprovedPromotionPreviousPositionName());

        List<PerformanceReportTransferLogDto> logs = result.getTransferLogs();
        assertNotNull(logs);
        assertEquals(2, logs.size());

        PerformanceReportTransferLogDto first = logs.get(0);
        assertEquals("PERMANENT_TRANSFER", first.getTransferType());
        assertEquals("Engineering", first.getFromDepartmentName());
        assertEquals("Marketing", first.getToDepartmentName());
        assertEquals("Senior Developer", first.getFromPositionName());
        assertEquals("Marketing Lead", first.getToPositionName());
        assertEquals("2025-07-01", first.getEffectiveStartDate());
        assertNull(first.getEffectiveEndDate());
        assertTrue(first.isCurrent());
        assertEquals("Department restructuring", first.getReason());
        assertEquals("Permanent move", first.getRemarks());

        PerformanceReportTransferLogDto second = logs.get(1);
        assertEquals("TEMPORARY", second.getTransferType());
        assertEquals("2025-03-01", second.getEffectiveStartDate());
        assertEquals("2025-06-01", second.getEffectiveEndDate());
        assertFalse(second.isCurrent());
    }

    @Test
    void testNonPromotedEmployee_ReturnsNullPromotionFieldsAndEmptyTransferLogs() {
        when(employeeRepository.findById(100L)).thenReturn(Optional.of(employee));
        when(kpiRepository.findLatestPeriodByEmployee_Id(100L)).thenReturn(Optional.empty());
        when(appraisalRepository.findByEmployeeId(100L)).thenReturn(List.of());
        when(selfAssessmentRepository.findByEmployee(employee)).thenReturn(List.of());
        when(feedbackRepository.findByEvaluateeId(eq(100L), any())).thenReturn(org.springframework.data.domain.Page.empty());
        when(pipRepository.existsByEmployeeAndStatusIn(employee, List.of("ACTIVE", "REOPEN_REQUESTED"))).thenReturn(false);
        when(pipRepository.findByEmployee(employee)).thenReturn(List.of());
        when(promotionProposalRepository.existsByEmployeeIdAndStatusIn(100L, List.of(PromotionProposalStatus.PENDING))).thenReturn(false);
        when(promotionProposalRepository.existsByEmployeeIdAndStatusIn(100L, List.of(PromotionProposalStatus.APPROVED))).thenReturn(false);
        when(profilePictureStorageService.toPublicUrl(any())).thenReturn(null);

        // No approved proposals
        when(promotionProposalRepository.findLatestApprovedByEmployee(100L)).thenReturn(List.of());

        // No transfer logs
        when(employeeDepartmentHistoryRepository
                .findByEmployee_IdAndTransferTypeInOrderByEffectiveStartDateDesc(100L,
                        List.of(TransferType.TEMPORARY, TransferType.PERMANENT_TRANSFER)))
                .thenReturn(List.of());

        PerformanceReportSummaryDto result = service.getEmployeeReportSummary(100L);

        assertNotNull(result);
        assertNull(result.getLatestApprovedPromotionId());
        assertNull(result.getLatestApprovedPromotionReason());
        assertNull(result.getLatestApprovedPromotionEffectiveDate());
        assertNull(result.getLatestApprovedPromotionTargetPositionName());
        assertNull(result.getLatestApprovedPromotionApprovedAt());
        assertNull(result.getLatestApprovedPromotionPreviousPositionName());

        List<PerformanceReportTransferLogDto> logs = result.getTransferLogs();
        assertNotNull(logs);
        assertTrue(logs.isEmpty());
    }

    @Test
    void testTransferLogs_ExcludesInitialReturnAndPromotion() {
        when(employeeRepository.findById(100L)).thenReturn(Optional.of(employee));
        when(kpiRepository.findLatestPeriodByEmployee_Id(100L)).thenReturn(Optional.empty());
        when(appraisalRepository.findByEmployeeId(100L)).thenReturn(List.of());
        when(selfAssessmentRepository.findByEmployee(employee)).thenReturn(List.of());
        when(feedbackRepository.findByEvaluateeId(eq(100L), any())).thenReturn(org.springframework.data.domain.Page.empty());
        when(pipRepository.existsByEmployeeAndStatusIn(employee, List.of("ACTIVE", "REOPEN_REQUESTED"))).thenReturn(false);
        when(pipRepository.findByEmployee(employee)).thenReturn(List.of());
        when(promotionProposalRepository.existsByEmployeeIdAndStatusIn(100L, List.of(PromotionProposalStatus.PENDING))).thenReturn(false);
        when(promotionProposalRepository.existsByEmployeeIdAndStatusIn(100L, List.of(PromotionProposalStatus.APPROVED))).thenReturn(false);
        when(profilePictureStorageService.toPublicUrl(any())).thenReturn(null);
        when(promotionProposalRepository.findLatestApprovedByEmployee(100L)).thenReturn(List.of());

        // Only TEMPORARY and PERMANENT_TRANSFER should be returned
        Department dept = new Department();
        dept.setId(1L);
        dept.setName("Engineering");
        Position pos = new Position();
        pos.setId(1L);
        pos.setName("Developer");

        EmployeeDepartmentHistory temp = new EmployeeDepartmentHistory();
        temp.setId(1L);
        temp.setTransferType(TransferType.TEMPORARY);
        temp.setFromDepartment(dept);
        temp.setToDepartment(dept);
        temp.setFromPosition(pos);
        temp.setToPosition(pos);
        temp.setEffectiveStartDate(LocalDate.of(2025, 1, 1));
        temp.setCurrent(false);

        EmployeeDepartmentHistory perm = new EmployeeDepartmentHistory();
        perm.setId(2L);
        perm.setTransferType(TransferType.PERMANENT_TRANSFER);
        perm.setFromDepartment(dept);
        perm.setToDepartment(dept);
        perm.setFromPosition(pos);
        perm.setToPosition(pos);
        perm.setEffectiveStartDate(LocalDate.of(2025, 2, 1));
        perm.setCurrent(true);

        when(employeeDepartmentHistoryRepository
                .findByEmployee_IdAndTransferTypeInOrderByEffectiveStartDateDesc(eq(100L),
                        argThat(types -> types.contains(TransferType.TEMPORARY) && types.contains(TransferType.PERMANENT_TRANSFER)
                                && types.size() == 2)))
                .thenReturn(List.of(perm, temp));

        PerformanceReportSummaryDto result = service.getEmployeeReportSummary(100L);

        List<PerformanceReportTransferLogDto> logs = result.getTransferLogs();
        assertEquals(2, logs.size());
        assertTrue(logs.stream().allMatch(l ->
                "TEMPORARY".equals(l.getTransferType()) || "PERMANENT_TRANSFER".equals(l.getTransferType())));
        assertTrue(logs.stream().noneMatch(l ->
                "INITIAL".equals(l.getTransferType()) || "RETURN".equals(l.getTransferType()) || "PROMOTION".equals(l.getTransferType())));
    }

    @Test
    void testPromotedEmployee_FallsBackToCreatedAtWhenUpdatedAtIsNull() {
        when(employeeRepository.findById(100L)).thenReturn(Optional.of(employee));
        when(kpiRepository.findLatestPeriodByEmployee_Id(100L)).thenReturn(Optional.empty());
        when(appraisalRepository.findByEmployeeId(100L)).thenReturn(List.of());
        when(selfAssessmentRepository.findByEmployee(employee)).thenReturn(List.of());
        when(feedbackRepository.findByEvaluateeId(eq(100L), any())).thenReturn(org.springframework.data.domain.Page.empty());
        when(pipRepository.existsByEmployeeAndStatusIn(employee, List.of("ACTIVE", "REOPEN_REQUESTED"))).thenReturn(false);
        when(pipRepository.findByEmployee(employee)).thenReturn(List.of());
        when(promotionProposalRepository.existsByEmployeeIdAndStatusIn(100L, List.of(PromotionProposalStatus.PENDING))).thenReturn(false);
        when(promotionProposalRepository.existsByEmployeeIdAndStatusIn(100L, List.of(PromotionProposalStatus.APPROVED))).thenReturn(true);
        when(profilePictureStorageService.toPublicUrl(any())).thenReturn(null);

        // Proposal with null updatedAt
        PromotionProposal proposal = new PromotionProposal();
        proposal.setId(1L);
        proposal.setRemarks("Promoted");
        proposal.setEffectiveDate(LocalDate.of(2025, 6, 1));
        Position targetPos = new Position();
        targetPos.setId(2L);
        targetPos.setName("Tech Lead");
        proposal.setTargetPosition(targetPos);
        proposal.setCreatedAt(LocalDateTime.of(2025, 5, 10, 9, 0, 0));
        proposal.setUpdatedAt(null);
        when(promotionProposalRepository.findLatestApprovedByEmployee(100L)).thenReturn(List.of(proposal));

        Position fromPos = new Position();
        fromPos.setId(1L);
        fromPos.setName("Junior Developer");
        EmployeeDepartmentHistory promotionHistory = new EmployeeDepartmentHistory();
        promotionHistory.setId(10L);
        promotionHistory.setFromPosition(fromPos);
        promotionHistory.setTransferType(TransferType.PROMOTION);
        when(employeeDepartmentHistoryRepository
                .findFirstByEmployee_IdAndTransferTypeOrderByEffectiveStartDateDesc(100L, TransferType.PROMOTION))
                .thenReturn(Optional.of(promotionHistory));

        when(employeeDepartmentHistoryRepository
                .findByEmployee_IdAndTransferTypeInOrderByEffectiveStartDateDesc(100L,
                        List.of(TransferType.TEMPORARY, TransferType.PERMANENT_TRANSFER)))
                .thenReturn(List.of());

        PerformanceReportSummaryDto result = service.getEmployeeReportSummary(100L);

        assertEquals("2025-05-10T09:00", result.getLatestApprovedPromotionApprovedAt());
    }

    @Test
    void testMissingPromotionHistory_ShowsPreviousPositionAsNull() {
        when(employeeRepository.findById(100L)).thenReturn(Optional.of(employee));
        when(kpiRepository.findLatestPeriodByEmployee_Id(100L)).thenReturn(Optional.empty());
        when(appraisalRepository.findByEmployeeId(100L)).thenReturn(List.of());
        when(selfAssessmentRepository.findByEmployee(employee)).thenReturn(List.of());
        when(feedbackRepository.findByEvaluateeId(eq(100L), any())).thenReturn(org.springframework.data.domain.Page.empty());
        when(pipRepository.existsByEmployeeAndStatusIn(employee, List.of("ACTIVE", "REOPEN_REQUESTED"))).thenReturn(false);
        when(pipRepository.findByEmployee(employee)).thenReturn(List.of());
        when(promotionProposalRepository.existsByEmployeeIdAndStatusIn(100L, List.of(PromotionProposalStatus.PENDING))).thenReturn(false);
        when(promotionProposalRepository.existsByEmployeeIdAndStatusIn(100L, List.of(PromotionProposalStatus.APPROVED))).thenReturn(true);
        when(profilePictureStorageService.toPublicUrl(any())).thenReturn(null);

        PromotionProposal proposal = new PromotionProposal();
        proposal.setId(1L);
        proposal.setRemarks("Promoted");
        proposal.setEffectiveDate(LocalDate.of(2025, 6, 1));
        Position targetPos = new Position();
        targetPos.setId(2L);
        targetPos.setName("Tech Lead");
        proposal.setTargetPosition(targetPos);
        proposal.setUpdatedAt(LocalDateTime.of(2025, 5, 15, 14, 30));
        when(promotionProposalRepository.findLatestApprovedByEmployee(100L)).thenReturn(List.of(proposal));

        // No promotion history row
        when(employeeDepartmentHistoryRepository
                .findFirstByEmployee_IdAndTransferTypeOrderByEffectiveStartDateDesc(100L, TransferType.PROMOTION))
                .thenReturn(Optional.empty());

        when(employeeDepartmentHistoryRepository
                .findByEmployee_IdAndTransferTypeInOrderByEffectiveStartDateDesc(100L,
                        List.of(TransferType.TEMPORARY, TransferType.PERMANENT_TRANSFER)))
                .thenReturn(List.of());

        PerformanceReportSummaryDto result = service.getEmployeeReportSummary(100L);

        assertNull(result.getLatestApprovedPromotionPreviousPositionName());
    }
}
