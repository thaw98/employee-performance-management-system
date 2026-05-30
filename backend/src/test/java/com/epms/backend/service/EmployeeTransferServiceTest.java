package com.epms.backend.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.epms.backend.dto.transfer.MakePermanentRequestDto;
import com.epms.backend.dto.transfer.PermanentTransferRequestDto;
import com.epms.backend.entity.Department;
import com.epms.backend.entity.DepartmentPosition;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.EmployeeDepartmentHistory;
import com.epms.backend.entity.Position;
import com.epms.backend.entity.Role;
import com.epms.backend.entity.TransferType;
import com.epms.backend.entity.User;
import com.epms.backend.repository.DepartmentPositionRepository;
import com.epms.backend.repository.DepartmentRepository;
import com.epms.backend.repository.EmployeeDepartmentHistoryRepository;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.EmployeeReportingHistoryRepository;
import com.epms.backend.repository.PositionRepository;
import com.epms.backend.security.UserPrincipal;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class EmployeeTransferServiceTest {

    private EmployeeRepository employeeRepository;
    private DepartmentRepository departmentRepository;
    private DepartmentPositionRepository departmentPositionRepository;
    private PositionRepository positionRepository;
    private EmployeeDepartmentHistoryRepository historyRepository;
    private EmployeeReportingHistoryRepository reportingHistoryRepository;
    private AuditService auditService;
    private NotificationService notificationService;
    private EmployeeTransferService transferService;

    private Employee employee;
    private User employeeUserAccount;
    private Department fromDept;
    private Department toDept;
    private Position fromPos;
    private Position toPos;
    private EmployeeDepartmentHistory currentTransfer;
    private DepartmentPosition deptPosMapping;
    private UserPrincipal actor;

    @BeforeEach
    void setUp() {
        employeeRepository = org.mockito.Mockito.mock(EmployeeRepository.class);
        departmentRepository = org.mockito.Mockito.mock(DepartmentRepository.class);
        departmentPositionRepository = org.mockito.Mockito.mock(DepartmentPositionRepository.class);
        positionRepository = org.mockito.Mockito.mock(PositionRepository.class);
        historyRepository = org.mockito.Mockito.mock(EmployeeDepartmentHistoryRepository.class);
        reportingHistoryRepository = org.mockito.Mockito.mock(EmployeeReportingHistoryRepository.class);
        auditService = org.mockito.Mockito.mock(AuditService.class);
        notificationService = org.mockito.Mockito.mock(NotificationService.class);

        transferService = new EmployeeTransferService(
                employeeRepository, departmentRepository, departmentPositionRepository,
                positionRepository, historyRepository, reportingHistoryRepository,
                auditService, notificationService);

        employeeUserAccount = new User();
        employeeUserAccount.setId(10L);

        employee = new Employee();
        employee.setId(100L);
        employee.setEmployeeName("Test Employee");
        employee.setUserAccount(employeeUserAccount);

        fromDept = new Department();
        fromDept.setId(1L);
        fromDept.setName("Engineering");

        toDept = new Department();
        toDept.setId(2L);
        toDept.setName("Marketing");

        fromPos = new Position();
        fromPos.setId(10L);
        fromPos.setName("Developer");

        toPos = new Position();
        toPos.setId(20L);
        toPos.setName("Marketing Lead");

        currentTransfer = new EmployeeDepartmentHistory();
        currentTransfer.setId(1L);
        currentTransfer.setEmployee(employee);
        currentTransfer.setFromDepartment(fromDept);
        currentTransfer.setToDepartment(fromDept);
        currentTransfer.setFromPosition(fromPos);
        currentTransfer.setToPosition(fromPos);
        currentTransfer.setTransferType(TransferType.INITIAL);
        currentTransfer.setEffectiveStartDate(LocalDate.of(2024, 1, 1));
        currentTransfer.setCurrent(true);

        deptPosMapping = new DepartmentPosition();
        deptPosMapping.setDepartment(toDept);
        deptPosMapping.setPosition(toPos);
        deptPosMapping.setStatus("active");

        Role role = new Role();
        role.setId(1L);

        User actorUser = new User();
        actorUser.setId(1L);
        actorUser.setRole(role);

        actor = new UserPrincipal(actorUser);
    }

    @Test
    void permanentTransferSendsTransferNotificationToEmployee() {
        PermanentTransferRequestDto req = new PermanentTransferRequestDto();
        req.setToDepartmentId(2L);
        req.setToPositionId(20L);
        req.setEffectiveStartDate(LocalDate.of(2025, 6, 1));
        req.setReason("Restructuring");

        when(employeeRepository.findById(100L)).thenReturn(Optional.of(employee));
        when(departmentRepository.findById(2L)).thenReturn(Optional.of(toDept));
        when(positionRepository.findByIdWithLevelCodeAndRole(20L)).thenReturn(Optional.of(toPos));
        when(departmentPositionRepository.findByDepartmentIdAndPositionId(2L, 20L))
                .thenReturn(Optional.of(deptPosMapping));
        when(historyRepository.findByEmployee_IdAndCurrentTrue(100L))
                .thenReturn(Optional.of(currentTransfer));
        when(employeeRepository.save(any(Employee.class))).thenReturn(employee);
        when(historyRepository.save(any(EmployeeDepartmentHistory.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        transferService.permanentTransfer(100L, req, actor);

        verify(notificationService).send(
                eq(employeeUserAccount),
                eq("Permanent Transfer Completed"),
                anyString(),
                eq("TRANSFER"),
                eq(100L));
    }

    @Test
    void permanentTransferSkipsNotificationWhenEmployeeHasNoUserAccount() {
        employee.setUserAccount(null);

        PermanentTransferRequestDto req = new PermanentTransferRequestDto();
        req.setToDepartmentId(2L);
        req.setToPositionId(20L);
        req.setEffectiveStartDate(LocalDate.of(2025, 6, 1));

        when(employeeRepository.findById(100L)).thenReturn(Optional.of(employee));
        when(departmentRepository.findById(2L)).thenReturn(Optional.of(toDept));
        when(positionRepository.findByIdWithLevelCodeAndRole(20L)).thenReturn(Optional.of(toPos));
        when(departmentPositionRepository.findByDepartmentIdAndPositionId(2L, 20L))
                .thenReturn(Optional.of(deptPosMapping));
        when(historyRepository.findByEmployee_IdAndCurrentTrue(100L))
                .thenReturn(Optional.of(currentTransfer));
        when(employeeRepository.save(any(Employee.class))).thenReturn(employee);
        when(historyRepository.save(any(EmployeeDepartmentHistory.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        transferService.permanentTransfer(100L, req, actor);

        verify(notificationService, never()).send(
                any(User.class), anyString(), anyString(), anyString(), anyLong());
    }

    @Test
    void makePermanentSendsTransferNotificationToEmployee() {
        EmployeeDepartmentHistory temporaryTransfer = new EmployeeDepartmentHistory();
        temporaryTransfer.setId(2L);
        temporaryTransfer.setEmployee(employee);
        temporaryTransfer.setFromDepartment(fromDept);
        temporaryTransfer.setToDepartment(toDept);
        temporaryTransfer.setFromPosition(fromPos);
        temporaryTransfer.setToPosition(toPos);
        temporaryTransfer.setTransferType(TransferType.TEMPORARY);
        temporaryTransfer.setEffectiveStartDate(LocalDate.of(2025, 1, 1));
        temporaryTransfer.setEffectiveEndDate(LocalDate.of(2025, 12, 31));
        temporaryTransfer.setCurrent(true);

        MakePermanentRequestDto req = new MakePermanentRequestDto();
        req.setEffectiveStartDate(LocalDate.of(2025, 6, 1));
        req.setReason("Good performance");

        when(employeeRepository.findById(100L)).thenReturn(Optional.of(employee));
        when(historyRepository.findByEmployee_IdAndCurrentTrue(100L))
                .thenReturn(Optional.of(temporaryTransfer));
        when(employeeRepository.save(any(Employee.class))).thenReturn(employee);
        when(historyRepository.save(any(EmployeeDepartmentHistory.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        transferService.makePermanent(100L, req, actor);

        verify(notificationService).send(
                eq(employeeUserAccount),
                eq("Temporary Transfer Made Permanent"),
                anyString(),
                eq("TRANSFER"),
                eq(100L));
    }
}
