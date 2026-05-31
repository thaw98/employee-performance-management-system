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

import com.epms.backend.entity.PromotionProposal;
import com.epms.backend.entity.PromotionProposalStatus;
import com.epms.backend.repository.PromotionProposalRepository;
import com.epms.backend.repository.DepartmentRepository;
import com.epms.backend.dto.PromotionProposalResponseDto;

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
    private final PromotionProposalRepository promotionProposalRepository;
    private final DepartmentRepository departmentRepository;
    private final PerformanceReportService performanceReportService;

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
                "PROMOTION",
                employeeId
            );
        }

        // Notify all members of the department
        notifyDepartmentMembers(employee, newPosition, req.getEffectiveDate(), null);

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
                            "PROMOTION",
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
                "PROMOTION",
                employeeId
            );
        }
    }

    @Transactional(readOnly = true)
    public List<PositionDto> getAvailablePositions(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        Position currentPos = employee.getPosition();
        Department currentDept = employee.getDepartment();
        if (currentDept == null) {
            return new ArrayList<>();
        }

        // 1. Fetch overall rating
        Double overallRating = null;
        try {
            var reportSummary = performanceReportService.getEmployeeReportSummary(employeeId);
            if (reportSummary != null) {
                overallRating = reportSummary.getOverallRating();
            }
        } catch (Exception e) {
            // ignore calculation failure, fallback to null
        }

        // 2. Determine recommended level code
        boolean highRating = overallRating != null && overallRating >= 3.5;
        String currentLevel = (currentPos != null && currentPos.getLevelCode() != null) ? currentPos.getLevelCode().getCode() : null;
        String recommendedLevel = null;
        if (highRating && currentLevel != null && currentLevel.startsWith("L") && currentLevel.length() > 1) {
            try {
                int num = Integer.parseInt(currentLevel.substring(1));
                if (num > 1) {
                    recommendedLevel = String.format("L%02d", num - 1);
                }
            } catch (NumberFormatException e) {
                // ignore
            }
        }

        // 3. Fetch active department position mappings for employee's department
        List<DepartmentPosition> activeMappings = departmentPositionRepository.findActiveByDepartmentIdWithPosition(currentDept.getId());

        final String finalRecLevel = recommendedLevel;
        return activeMappings.stream()
            // Filter out employee's current position
            .filter(dp -> currentPos == null || !dp.getPosition().getId().equals(currentPos.getId()))
            .map(dp -> {
                Position p = dp.getPosition();
                boolean isRec = false;
                if (finalRecLevel != null && p.getLevelCode() != null) {
                    isRec = finalRecLevel.equalsIgnoreCase(p.getLevelCode().getCode());
                }
                return PositionDto.builder()
                    .positionId(p.getId())
                    .positionCode(p.getCode())
                    .positionName(p.getName())
                    .status(p.getStatus())
                    .levelCodeId(p.getLevelCode() != null ? p.getLevelCode().getId() : null)
                    .levelCodeName(p.getLevelCode() != null ? p.getLevelCode().getCode() : null)
                    .roleId(p.getRole() != null ? p.getRole().getId() : null)
                    .roleName(p.getRole() != null ? p.getRole().getName() : null)
                    .departmentId(dp.getDepartment().getId())
                    .departmentName(dp.getDepartment().getName())
                    .recommended(isRec)
                    .build();
            })
            // Sort by recommended first (true before false), then position name
            .sorted(java.util.Comparator.comparing((PositionDto p) -> p.getRecommended() != null && p.getRecommended() ? 0 : 1)
                .thenComparing(PositionDto::getPositionName, java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder())))
            .toList();
    }

    @Transactional
    public void proposePromotion(Long employeeId, PromotionRequestDto req, UserPrincipal actor) {
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

        // Determine target department
        Department targetDept = currentDept;
        if (req.getTargetDepartmentId() != null) {
            targetDept = departmentRepository.findById(req.getTargetDepartmentId())
                .orElseThrow(() -> new IllegalArgumentException("Target department not found"));
        }

        // 3. Verify target position belongs to target department and is active
        DepartmentPosition mapping = departmentPositionRepository
            .findByDepartmentIdAndPositionId(targetDept.getId(), newPosition.getId())
            .orElseThrow(() -> new IllegalArgumentException("Position does not belong to the selected department"));

        if (!"active".equalsIgnoreCase(mapping.getStatus())) {
            throw new IllegalArgumentException("Position is not active in this department");
        }

        // 4. Verify not same position in same department
        Position oldPosition = employee.getPosition();
        if (oldPosition != null && oldPosition.getId().equals(newPosition.getId()) && currentDept.getId().equals(targetDept.getId())) {
            throw new IllegalArgumentException("Cannot promote to the same position in the same department");
        }

        // 5. Create PromotionProposal
        User requester = userRepository.findById(actor.getId())
            .orElseThrow(() -> new IllegalArgumentException("Requester not found"));

        PromotionProposal proposal = new PromotionProposal();
        proposal.setEmployee(employee);
        proposal.setTargetPosition(newPosition);
        proposal.setRequester(requester);
        proposal.setDepartment(currentDept);
        proposal.setTargetDepartment(targetDept);
        proposal.setEffectiveDate(req.getEffectiveDate());
        proposal.setRemarks(req.getRemarks());
        proposal.setStatus(PromotionProposalStatus.PENDING);
        proposal.setCreatedAt(LocalDateTime.now());
        
        promotionProposalRepository.save(proposal);

        // 6. Notify Department Head/Manager (employee's current department manager)
        Long deptManagerId = currentDept.getManagerId();
        if (deptManagerId != null) {
            userRepository.findByEmployee_Id(deptManagerId).ifPresent(managerUser -> {
                notificationService.send(
                    managerUser,
                    "New Promotion Proposal",
                    "A promotion proposal has been submitted for " + employee.getEmployeeName() + " to " + newPosition.getName() + ". Please review and action it.",
                    "PROMOTION",
                    proposal.getId()
                );
            });
        }
    }

    @Transactional(readOnly = true)
    public List<PromotionProposalResponseDto> getPendingProposals(UserPrincipal manager) {
        Long empDbId = manager.getEmployeeDbId();
        if (empDbId == null) {
            return new ArrayList<>();
        }
        Department dept = departmentRepository.findFirstByManagerId(empDbId)
            .orElse(null);
        if (dept == null) {
            return new ArrayList<>();
        }
        return promotionProposalRepository.findByDepartmentIdAndStatus(dept.getId(), PromotionProposalStatus.PENDING)
            .stream()
            .map(this::mapToDto)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<PromotionProposalResponseDto> getProposalsHistory(UserPrincipal user) {
        if ("HR".equalsIgnoreCase(user.getRoleName())) {
            return promotionProposalRepository.findAllWithDetails()
                .stream()
                .map(this::mapToDto)
                .toList();
        } else if ("MANAGER".equalsIgnoreCase(user.getRoleName())
                || "DEPARTMENT HEAD".equalsIgnoreCase(user.getRoleName())
                || "DEPARTMENT_HEAD".equalsIgnoreCase(user.getRoleName())) {
            Long empDbId = user.getEmployeeDbId();
            if (empDbId == null) {
                return new ArrayList<>();
            }
            Department dept = departmentRepository.findFirstByManagerId(empDbId)
                .orElse(null);
            if (dept == null) {
                return new ArrayList<>();
            }
            return promotionProposalRepository.findByDepartmentIdWithDetails(dept.getId())
                .stream()
                .map(this::mapToDto)
                .toList();
        }
        return new ArrayList<>();
    }

    @Transactional
    public void approveProposal(Long proposalId, UserPrincipal actor) {
        PromotionProposal proposal = promotionProposalRepository.findById(proposalId)
            .orElseThrow(() -> new IllegalArgumentException("Proposal not found"));

        if (proposal.getStatus() != PromotionProposalStatus.PENDING) {
            throw new IllegalArgumentException("Proposal is already actioned");
        }

        // Verify authority - actor must be the department manager of the employee's department
        Department dept = proposal.getDepartment();
        if (dept == null || dept.getManagerId() == null || !dept.getManagerId().equals(actor.getEmployeeDbId())) {
            throw new IllegalArgumentException("You are not authorized to approve this promotion proposal");
        }

        Employee employee = proposal.getEmployee();
        Position newPosition = proposal.getTargetPosition();
        Position oldPosition = employee.getPosition();
        Department targetDept = proposal.getTargetDepartment() != null ? proposal.getTargetDepartment() : dept;

        DepartmentPosition mapping = departmentPositionRepository
            .findByDepartmentIdAndPositionId(targetDept.getId(), newPosition.getId())
            .orElseThrow(() -> new IllegalArgumentException("Position mapping not found"));

        // Close current history
        EmployeeDepartmentHistory currentHistory = historyRepository
            .findByEmployee_IdAndCurrentTrue(employee.getId())
            .orElse(null);

        if (currentHistory != null) {
            currentHistory.setCurrent(false);
            currentHistory.setEffectiveEndDate(proposal.getEffectiveDate().minusDays(1));
            currentHistory.setUpdatedBy(actor.getId());
            currentHistory.setUpdatedOn(LocalDateTime.now());
            historyRepository.save(currentHistory);
        }

        // Create new promotion history
        EmployeeDepartmentHistory newHistory = new EmployeeDepartmentHistory();
        newHistory.setEmployee(employee);
        newHistory.setFromDepartment(dept);
        newHistory.setToDepartment(targetDept);
        newHistory.setFromPosition(oldPosition);
        newHistory.setToPosition(newPosition);
        newHistory.setTransferType(TransferType.PROMOTION);
        newHistory.setEffectiveStartDate(proposal.getEffectiveDate());
        newHistory.setCurrent(true);
        newHistory.setReason("Promotion");
        newHistory.setRemarks(proposal.getRemarks());
        newHistory.setCreatedBy(actor.getId());
        newHistory.setCreatedOn(LocalDateTime.now());
        historyRepository.save(newHistory);

        // Update employee department and position
        employee.setDepartment(targetDept);
        employee.setPosition(newPosition);
        employee.setDepartmentPosition(mapping);
        employeeRepository.save(employee);

        // Update proposal status
        proposal.setStatus(PromotionProposalStatus.APPROVED);
        proposal.setUpdatedAt(LocalDateTime.now());
        promotionProposalRepository.save(proposal);

        // Record audit log
        auditService.record(
            AuditActionType.EMPLOYEE_PROMOTION,
            AuditTargetType.EMPLOYEE,
            employee.getId(),
            actor.getId(),
            actor.getRoleId(),
            "Promoted employee " + employee.getEmployeeName() 
                + " from " + (oldPosition != null ? oldPosition.getName() : "N/A") 
                + " to " + newPosition.getName() + " in department " + targetDept.getName() + " (Approved proposal ID: " + proposalId + ")",
            null
        );

        // Send notifications
        // 1. Notify Requester (HR User)
        if (proposal.getRequester() != null) {
            notificationService.send(
                proposal.getRequester(),
                "Promotion Approved",
                "The promotion proposal for " + employee.getEmployeeName() + " to " + newPosition.getName() + " has been APPROVED.",
                "PROMOTION",
                proposal.getId()
            );
        }

        // 2. Notify Employee
        User employeeUser = employee.getUserAccount();
        if (employeeUser != null) {
            notificationService.send(
                employeeUser,
                "Promotion Notification",
                "Congratulations! You have been promoted to " + newPosition.getName() + " effective " + proposal.getEffectiveDate() + ".",
                "PROMOTION",
                employee.getId()
            );
        }

        // Notify all members of the department
        notifyDepartmentMembers(employee, newPosition, proposal.getEffectiveDate(), proposal.getId());
    }

    @Transactional
    public void rejectProposal(Long proposalId, UserPrincipal actor) {
        PromotionProposal proposal = promotionProposalRepository.findById(proposalId)
            .orElseThrow(() -> new IllegalArgumentException("Proposal not found"));

        if (proposal.getStatus() != PromotionProposalStatus.PENDING) {
            throw new IllegalArgumentException("Proposal is already actioned");
        }

        // Verify authority - actor must be the department manager of the employee's department
        Department dept = proposal.getDepartment();
        if (dept == null || dept.getManagerId() == null || !dept.getManagerId().equals(actor.getEmployeeDbId())) {
            throw new IllegalArgumentException("You are not authorized to reject this promotion proposal");
        }

        proposal.setStatus(PromotionProposalStatus.REJECTED);
        proposal.setUpdatedAt(LocalDateTime.now());
        promotionProposalRepository.save(proposal);

        // Notify Requester (HR User)
        if (proposal.getRequester() != null) {
            notificationService.send(
                proposal.getRequester(),
                "Promotion Rejected",
                "The promotion proposal for " + proposal.getEmployee().getEmployeeName() + " to " + proposal.getTargetPosition().getName() + " has been REJECTED.",
                "PROMOTION",
                proposal.getId()
            );
        }
    }

    @Transactional(readOnly = true)
    public PromotionProposalResponseDto getLatestApprovedPromotionForEmployee(Long employeeId) {
        if (employeeId == null) {
            return null;
        }
        List<PromotionProposal> proposals = promotionProposalRepository.findLatestApprovedByEmployee(employeeId);
        if (proposals.isEmpty()) {
            return null;
        }
        return mapToDto(proposals.get(0));
    }

    private PromotionProposalResponseDto mapToDto(PromotionProposal p) {
        return PromotionProposalResponseDto.builder()
            .id(p.getId())
            .employeeId(p.getEmployee().getId())
            .employeeName(p.getEmployee().getEmployeeName())
            .staffNo(p.getEmployee().getEmployeeId())
            .oldPositionId(p.getEmployee().getPosition() != null ? p.getEmployee().getPosition().getId() : null)
            .oldPositionName(p.getEmployee().getPosition() != null ? p.getEmployee().getPosition().getName() : "N/A")
            .targetPositionId(p.getTargetPosition().getId())
            .targetPositionName(p.getTargetPosition().getName())
            .requesterName(p.getRequester() != null && p.getRequester().getEmployee() != null ? p.getRequester().getEmployee().getEmployeeName() : "HR")
            .departmentId(p.getDepartment().getId())
            .departmentName(p.getDepartment().getName())
            .targetDepartmentId(p.getTargetDepartment() != null ? p.getTargetDepartment().getId() : p.getDepartment().getId())
            .targetDepartmentName(p.getTargetDepartment() != null ? p.getTargetDepartment().getName() : p.getDepartment().getName())
            .effectiveDate(p.getEffectiveDate())
            .remarks(p.getRemarks())
            .status(p.getStatus().name())
            .createdAt(p.getCreatedAt())
            .updatedAt(p.getUpdatedAt())
            .build();
    }

    private void notifyDepartmentMembers(Employee promotedEmployee, Position newPosition, java.time.LocalDate effectiveDate, Long proposalId) {
        Department dept = promotedEmployee.getDepartment();
        if (dept == null) {
            return;
        }
        List<Employee> deptEmployees = employeeRepository.findByDepartmentId(dept.getId());
        for (Employee emp : deptEmployees) {
            if (!emp.getId().equals(promotedEmployee.getId())) {
                userRepository.findByEmployee_Id(emp.getId()).ifPresent(empUser -> {
                    notificationService.send(
                        empUser,
                        "Department Promotion Announcement",
                        promotedEmployee.getEmployeeName() + " has been promoted to " + newPosition.getName() + " effective " + effectiveDate + ".",
                        "PROMOTION",
                        proposalId
                    );
                });
            }
        }
    }
}
