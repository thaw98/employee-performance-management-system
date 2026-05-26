package com.epms.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.dto.PromotionRequestDto;
import com.epms.backend.dto.position.PositionDto;
import com.epms.backend.entity.Department;
import com.epms.backend.entity.DepartmentPosition;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.EmployeeDepartmentHistory;
import com.epms.backend.entity.Position;
import com.epms.backend.entity.TransferType;
import com.epms.backend.entity.User;
import com.epms.backend.repository.DepartmentPositionRepository;
import com.epms.backend.repository.EmployeeDepartmentHistoryRepository;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.PositionRepository;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.audit.AuditActionType;
import com.epms.backend.audit.AuditTargetType;
import com.epms.backend.security.UserPrincipal;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PromotionService {

    private final EmployeeRepository employeeRepository;
    private final PositionRepository positionRepository;
    private final DepartmentPositionRepository departmentPositionRepository;
    private final EmployeeDepartmentHistoryRepository historyRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @Transactional
    public void executePromotion(Long employeeId, PromotionRequestDto req, UserPrincipal actor) {
        // 1. Get Employee
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        // 2. Validate position exists
        Position newPosition = positionRepository.findById(req.getNewPositionId())
            .orElseThrow(() -> new IllegalArgumentException("Position not found"));

        Department currentDept = employee.getDepartment();
        if (currentDept == null) {
            throw new IllegalArgumentException("Employee does not belong to any department");
        }

        // 3. Verify target position belongs to department and is active
        DepartmentPosition mapping = departmentPositionRepository
            .findByDepartmentIdAndPositionId(currentDept.getId(), newPosition.getId())
            .orElseThrow(() -> new IllegalArgumentException("Position does not belong to employee's department"));

        if (!"active".equalsIgnoreCase(mapping.getStatus())) {
            throw new IllegalArgumentException("Position is not active in this department");
        }

        // 4. Verify not same position
        Position oldPosition = employee.getPosition();
        if (oldPosition != null && oldPosition.getId().equals(newPosition.getId())) {
            throw new IllegalArgumentException("Cannot promote to the same position");
        }

        // 5. Close current EmployeeDepartmentHistory
        EmployeeDepartmentHistory currentHistory = historyRepository
            .findByEmployee_IdAndCurrentTrue(employeeId)
            .orElse(null);

        if (currentHistory != null) {
            currentHistory.setCurrent(false);
            currentHistory.setEffectiveEndDate(req.getEffectiveDate().minusDays(1));
            currentHistory.setUpdatedBy(actor.getId());
            currentHistory.setUpdatedOn(LocalDateTime.now());
            historyRepository.save(currentHistory);
        }

        // 6. Create new EmployeeDepartmentHistory with TransferType.PROMOTION
        EmployeeDepartmentHistory newHistory = new EmployeeDepartmentHistory();
        newHistory.setEmployee(employee);
        newHistory.setFromDepartment(currentDept);
        newHistory.setToDepartment(currentDept);
        newHistory.setFromPosition(oldPosition);
        newHistory.setToPosition(newPosition);
        newHistory.setTransferType(TransferType.PROMOTION);
        newHistory.setEffectiveStartDate(req.getEffectiveDate());
        newHistory.setCurrent(true);
        newHistory.setReason("Promotion");
        newHistory.setRemarks(req.getRemarks());
        newHistory.setCreatedBy(actor.getId());
        newHistory.setCreatedOn(LocalDateTime.now());
        historyRepository.save(newHistory);

        // 7. Update Employee and save
        employee.setPosition(newPosition);
        employee.setDepartmentPosition(mapping);
        employeeRepository.save(employee);

        // 8. Record audit log
        auditService.record(
            AuditActionType.EMPLOYEE_PROMOTION,
            AuditTargetType.EMPLOYEE,
            employeeId,
            actor.getId(),
            actor.getRoleId(),
            "Promoted employee " + employee.getEmployeeName() 
                + " from " + (oldPosition != null ? oldPosition.getName() : "N/A") 
                + " to " + newPosition.getName(),
            null
        );

        // 9. Send Notification to Employee
        User employeeUser = employee.getUserAccount();
        if (employeeUser != null) {
            notificationService.send(
                employeeUser,
                "Promotion Notification",
                "Congratulations! You have been promoted to " + newPosition.getName() + " effective " + req.getEffectiveDate() + ".",
                "GENERAL",
                employeeId
            );
        }

        // 10. Send Notification to Manager if exists
        Employee manager = employee.getManager();
        if (manager == null && employee.getDepartment() != null) {
            // Check department manager
            Long deptManagerId = employee.getDepartment().getManagerId();
            if (deptManagerId != null) {
                employeeRepository.findById(deptManagerId).ifPresent(deptMgr -> {
                    if (deptMgr.getUserAccount() != null) {
                        notificationService.send(
                            deptMgr.getUserAccount(),
                            "Employee Promoted",
                            employee.getEmployeeName() + " has been promoted to " + newPosition.getName() + " effective " + req.getEffectiveDate() + ".",
                            "GENERAL",
                            employeeId
                        );
                    }
                });
            }
        } else if (manager != null && manager.getUserAccount() != null) {
            notificationService.send(
                manager.getUserAccount(),
                "Employee Promoted",
                employee.getEmployeeName() + " has been promoted to " + newPosition.getName() + " effective " + req.getEffectiveDate() + ".",
                "GENERAL",
                employeeId
            );
        }
    }

    @Transactional(readOnly = true)
    public List<PositionDto> getAvailablePositions(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        Department department = employee.getDepartment();
        if (department == null) {
            return new ArrayList<>();
        }

        List<DepartmentPosition> activeDeptPositions = departmentPositionRepository
            .findActiveByDepartmentIdWithPosition(department.getId());

        Position currentPos = employee.getPosition();

        return activeDeptPositions.stream()
            .map(DepartmentPosition::getPosition)
            .filter(p -> currentPos == null || !p.getId().equals(currentPos.getId()))
            .map(p -> PositionDto.builder()
                .positionId(p.getId())
                .positionCode(p.getCode())
                .positionName(p.getName())
                .status(p.getStatus())
                .levelCodeId(p.getLevelCode() != null ? p.getLevelCode().getId() : null)
                .levelCodeName(p.getLevelCode() != null ? p.getLevelCode().getCode() : null)
                .roleId(p.getRole() != null ? p.getRole().getId() : null)
                .roleName(p.getRole() != null ? p.getRole().getName() : null)
                .build())
            .toList();
    }
}
