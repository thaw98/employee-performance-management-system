package com.epms.backend.service;

import com.epms.backend.dto.kpi.PositionKpiDto;
import com.epms.backend.dto.kpi.PositionKpiRequestDto;
import com.epms.backend.entity.*;
import com.epms.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.epms.backend.security.UserPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class KpiManagementService {

    private final PositionKpiDefinitionRepository positionKpiDefinitionRepository;
    private final KpiCategoryRepository kpiCategoryRepository;
    private final PositionRepository positionRepository;
    private final EmployeeKpiAssignmentRepository employeeKpiAssignmentRepository;
    private final EmployeeRepository employeeRepository;
    private final KpiPeriodRepository kpiPeriodRepository;
    private final UserRepository userRepository;
    private final KpiRecordRepository kpiRecordRepository;

    // ==================== Categories ====================
    
    public List<KpiCategory> getAllCategories() {
        return kpiCategoryRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
    }

    public KpiCategory createCategory(String name) {
        KpiCategory category = new KpiCategory();
        category.setName(name);
        category.setIsActive(true);
        category.setDisplayOrder(0);
        return kpiCategoryRepository.save(category);
    }

    // ==================== Position KPI Definitions ====================
    
    public List<PositionKpiDefinition> getPositionKpis(Long positionId) {
        return positionKpiDefinitionRepository.findByPositionIdOrderByDisplayOrderAsc(positionId);
    }

    @Transactional
    public List<PositionKpiDefinition> savePositionKpis(PositionKpiRequestDto request) {
        // Validate total weight
        BigDecimal totalWeight = request.getKpis().stream()
                .map(PositionKpiDto::getWeight)
                .filter(w -> w != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (request.isFinal() && totalWeight.compareTo(new BigDecimal("100")) != 0) {
            throw new RuntimeException("Total KPI weight must equal 100%. Current total: " + totalWeight + "%");
        }

        // Delete existing KPIs for this position
        positionKpiDefinitionRepository.deleteByPositionId(request.getPositionId());

        // Save new KPIs
        List<PositionKpiDefinition> savedKpis = new ArrayList<>();
        int order = 0;
        for (PositionKpiDto dto : request.getKpis()) {
            if (dto.getKpiName() == null || dto.getKpiName().trim().isEmpty()) {
                continue; // Skip empty rows
            }
            
            PositionKpiDefinition def = new PositionKpiDefinition();
            def.setPosition(positionRepository.findById(request.getPositionId())
                    .orElseThrow(() -> new RuntimeException("Position not found")));
            def.setKpiName(dto.getKpiName());
            def.setCategory(dto.getCategory() != null ? dto.getCategory() : "General");
            def.setTarget(dto.getTarget());
            def.setUnit(dto.getUnit());
            def.setWeight(dto.getWeight() != null ? dto.getWeight() : BigDecimal.ZERO);
            def.setPriorityLevel(dto.getPriorityLevel() != null ? dto.getPriorityLevel() : "medium");
            def.setLogicDirection(dto.getLogicDirection() != null ? dto.getLogicDirection() : "higher");
            def.setDisplayOrder(order++);
            def.setIsActive(true);
            savedKpis.add(positionKpiDefinitionRepository.save(def));
        }

        log.info("Saved {} KPIs for position ID: {}", savedKpis.size(), request.getPositionId());
        return savedKpis;
    }

    public void deletePositionKpi(Long kpiId) {
        positionKpiDefinitionRepository.deleteById(kpiId);
        log.info("Deleted position KPI with ID: {}", kpiId);
    }

    public List<PositionKpiDto> getPositionKpisWithPositionName(Long positionId) {
        Position position = positionRepository.findById(positionId).orElse(null);
        List<PositionKpiDefinition> definitions = positionKpiDefinitionRepository
                .findByPositionIdOrderByDisplayOrderAsc(positionId);

        return definitions.stream().map(def -> PositionKpiDto.builder()
                .id(def.getId())
                .positionId(positionId)
                .positionName(position != null ? position.getName() : null)
                .kpiName(def.getKpiName())
                .category(def.getCategory())
                .target(def.getTarget())
                .unit(def.getUnit())
                .weight(def.getWeight())
                .priorityLevel(def.getPriorityLevel())
                .logicDirection(def.getLogicDirection())
                .displayOrder(def.getDisplayOrder())
                .isActive(def.getIsActive())
                .build()).collect(Collectors.toList());
    }

    // ==================== Positions & Employees ====================
    
    public List<Position> getAllPositions() {
        return positionRepository.findAll();
    }

    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    // ==================== Employee KPI Management ====================
    
    public List<PositionKpiDto> getEmployeeKpisWithActuals(Long employeeId) {
        // Get active period
        AppraisalCycle period = kpiPeriodRepository.findAll().stream()
                .filter(p -> "Active".equalsIgnoreCase(p.getStatus()))
                .findFirst()
                .orElse(null);

        if (period == null) {
            log.warn("No active KPI period found for employee ID: {}", employeeId);
            return new ArrayList<>();
        }

        // If no assignments exist, auto-create them from the employee's position
        // templates
        if (assignments.isEmpty()) {
            Employee employee = employeeRepository.findById(employeeId).orElse(null);
            if (employee != null && employee.getPosition() != null) {
                List<PositionKpiDefinition> positionKpis = positionKpiDefinitionRepository
                        .findByPositionIdOrderByDisplayOrderAsc(employee.getPosition().getId());
                for (PositionKpiDefinition def : positionKpis) {
                    EmployeeKpiAssignment assignment = new EmployeeKpiAssignment();
                    assignment.setEmployee(employee);
                    assignment.setPeriod(period);
                    assignment.setPositionKpi(def);
                    assignment.setStatus("ASSIGNED");
                    assignment.setIsLocked(false);
                    assignments.add(employeeKpiAssignmentRepository.save(assignment));
                }
                log.info("Auto-created {} KPI assignments for employee ID: {}", assignments.size(), employeeId);
            }
        }

        return assignments.stream().map(a -> PositionKpiDto.builder()
                .id(a.getPositionKpi().getId())
                .assignmentId(a.getId())
                .kpiName(a.getPositionKpi().getKpiName())
                .category(a.getPositionKpi().getCategory())
                .target(a.getPositionKpi().getTarget())
                .unit(a.getPositionKpi().getUnit())
                .weight(a.getPositionKpi().getWeight())
                .priorityLevel(a.getPositionKpi().getPriorityLevel())
                .logicDirection(a.getPositionKpi().getLogicDirection())
                .actualValue(a.getActualValue())
                .score(a.getScore())
                .weightedScore(a.getWeightedScore())
                .remarks(a.getRemarks())
                .isLocked(a.getIsLocked())
                .updatedBy(a.getUpdatedBy())
                .isActive(a.getPositionKpi().getIsActive())
                .build()).collect(Collectors.toList());
    }

    @Transactional
    public void updateEmployeeActualValues(Long employeeId, List<PositionKpiDto> updates) {
        // Get current user
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long currentUserId;
        if (principal instanceof UserPrincipal) {
            currentUserId = ((UserPrincipal) principal).getId();
        } else {
            currentUserId = Long.parseLong(SecurityContextHolder.getContext().getAuthentication().getName());
        }

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("Logged in user not found"));

        Employee targetEmployee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        // Authorization: Manager/HR can only update for employees in the same department
        boolean isHR = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_HR"));
        
        if (!isHR && (currentUser.getEmployee().getDepartment() == null || 
            !currentUser.getEmployee().getDepartment().getId().equals(targetEmployee.getDepartment().getId()))) {
            throw new RuntimeException("Access denied: You can only update KPIs for employees in your department");
        }

        // Get active period
        AppraisalCycle period = kpiPeriodRepository.findAll().stream()
                .filter(p -> "Active".equalsIgnoreCase(p.getStatus()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No active KPI period found"));

        for (PositionKpiDto update : updates) {
            EmployeeKpiAssignment assignment;

            if (update.getAssignmentId() == null) {
                // Create a new custom KPI for this employee
                PositionKpiDefinition def = new PositionKpiDefinition();
                def.setPosition(targetEmployee.getPosition());
                def.setKpiName(update.getKpiName());
                def.setCategory(update.getCategory() != null ? update.getCategory() : "Custom");
                def.setTarget(update.getTarget());
                def.setUnit(update.getUnit());
                def.setWeight(update.getWeight() != null ? update.getWeight() : BigDecimal.ZERO);
                def.setPriorityLevel(update.getPriorityLevel());
                def.setLogicDirection(update.getLogicDirection() != null ? update.getLogicDirection() : "higher");
                def.setIsActive(true);
                def = positionKpiDefinitionRepository.save(def);

                assignment = new EmployeeKpiAssignment();
                assignment.setEmployee(targetEmployee);
                assignment.setPeriod(period);
                assignment.setPositionKpi(def);
                assignment.setStatus("ASSIGNED");
                assignment.setIsLocked(false);
            } else {
                assignment = employeeKpiAssignmentRepository.findById(update.getAssignmentId())
                        .orElseThrow(() -> new RuntimeException("KPI assignment not found"));
            }

            // Check if locked
            if (Boolean.TRUE.equals(assignment.getIsLocked())) {
                throw new RuntimeException("Cannot update locked KPI: " + assignment.getPositionKpi().getKpiName());
            }

            // Update details if HR and assignment exists
            if (isHR && update.getAssignmentId() != null) {
                PositionKpiDefinition def = assignment.getPositionKpi();
                if (update.getKpiName() != null) def.setKpiName(update.getKpiName());
                if (update.getTarget() != null) def.setTarget(update.getTarget());
                if (update.getWeight() != null) def.setWeight(update.getWeight());
                if (update.getCategory() != null) def.setCategory(update.getCategory());
                if (update.getUnit() != null) def.setUnit(update.getUnit());
                if (update.getPriorityLevel() != null) def.setPriorityLevel(update.getPriorityLevel());
                if (update.getLogicDirection() != null) def.setLogicDirection(update.getLogicDirection());
                positionKpiDefinitionRepository.save(def);
            }

            // Update actual values
            assignment.setActualValue(update.getActualValue());
            assignment.setRemarks(update.getRemarks());
            assignment.setUpdatedBy(currentUser.getEmployee().getEmployeeName());
            assignment.setUpdatedDate(Instant.now());

            // Calculate score
            calculateAssignmentScore(assignment);

            employeeKpiAssignmentRepository.save(assignment);
            
            // Sync to KpiRecord
            syncToKpiRecord(assignment, currentUser.getEmployee(), period);
        }
        
        log.info("Updated KPI actual values for employee ID: {} by user: {}", employeeId, currentUser.getEmployee().getEmployeeName());
    }

    private void calculateAssignmentScore(EmployeeKpiAssignment assignment) {
        try {
            String targetStr = assignment.getPositionKpi().getTarget();
            if (targetStr == null || targetStr.trim().isEmpty()) {
                return;
            }
            
            String numericTarget = targetStr.replaceAll("[^\\d.-]", "");
            if (numericTarget.isEmpty()) {
                return;
            }
            
            BigDecimal targetVal = new BigDecimal(numericTarget);
            BigDecimal weightVal = assignment.getPositionKpi().getWeight();
            BigDecimal actualVal = assignment.getActualValue();

            if (targetVal.compareTo(BigDecimal.ZERO) > 0 && actualVal != null) {
                BigDecimal baseScore;
                if ("higher".equalsIgnoreCase(assignment.getPositionKpi().getLogicDirection())) {
                    baseScore = actualVal.divide(targetVal, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"));
                } else {
                    baseScore = targetVal.divide(actualVal, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"));
                }
                // Cap at 150%
                if (baseScore.compareTo(new BigDecimal("150")) > 0) {
                    baseScore = new BigDecimal("150");
                }
                assignment.setScore(baseScore);
                assignment.setWeightedScore(baseScore.multiply(weightVal).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP));
            } else {
                assignment.setScore(BigDecimal.ZERO);
                assignment.setWeightedScore(BigDecimal.ZERO);
            }
        } catch (Exception e) {
            log.warn("Could not calculate score for KPI {}: {}", assignment.getPositionKpi().getKpiName(), e.getMessage());
            assignment.setScore(BigDecimal.ZERO);
            assignment.setWeightedScore(BigDecimal.ZERO);
        }
    }

    @Transactional
    public void lockEmployeeKpis(Long employeeId) {
        // Verify HR role (should be checked in controller)
        AppraisalCycle period = kpiPeriodRepository.findAll().stream()
                .filter(p -> "Active".equalsIgnoreCase(p.getStatus()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No active KPI period found"));

        List<EmployeeKpiAssignment> assignments = employeeKpiAssignmentRepository.findByEmployeeIdAndPeriodId(employeeId, period.getId());
        
        if (assignments.isEmpty()) {
            throw new RuntimeException("No KPI assignments found for employee ID: " + employeeId);
        }
        
        for (EmployeeKpiAssignment assignment : assignments) {
            assignment.setIsLocked(true);
            assignment.setUpdatedDate(Instant.now());
            employeeKpiAssignmentRepository.save(assignment);
            
            // Sync to KpiRecord as Locked
            syncToKpiRecord(assignment, null, period);
        }
        
        log.info("Locked {} KPI assignments for employee ID: {}", assignments.size(), employeeId);
    }

    @Transactional
    public void unlockEmployeeKpis(Long employeeId) {
        AppraisalCycle period = kpiPeriodRepository.findAll().stream()
                .filter(p -> "Active".equalsIgnoreCase(p.getStatus()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No active KPI period found"));

        List<EmployeeKpiAssignment> assignments = employeeKpiAssignmentRepository.findByEmployeeIdAndPeriodId(employeeId, period.getId());
        
        for (EmployeeKpiAssignment assignment : assignments) {
            assignment.setIsLocked(false);
            assignment.setUpdatedDate(Instant.now());
            employeeKpiAssignmentRepository.save(assignment);
            
            // Sync to KpiRecord
            syncToKpiRecord(assignment, null, period);
        }
        
        log.info("Unlocked {} KPI assignments for employee ID: {}", assignments.size(), employeeId);
    }

    private void syncToKpiRecord(EmployeeKpiAssignment assignment, Employee updater, AppraisalCycle period) {
        // Find existing record or create new one
        List<KpiRecord> existingRecords = kpiRecordRepository.findByEmployeeIdAndPeriodIdAndKpi(
                assignment.getEmployee().getId(), 
                period != null ? period.getId() : assignment.getPeriod().getId(), 
                assignment.getPositionKpi().getKpiName()
        );
        
        KpiRecord record = existingRecords.stream().findFirst().orElse(new KpiRecord());

        record.setEmployee(assignment.getEmployee());
        record.setPeriodId(period != null ? period.getId() : assignment.getPeriod().getId());
        record.setPeriodName(period != null ? period.getName() : assignment.getPeriod().getName());
        record.setKpi(assignment.getPositionKpi().getKpiName());
        record.setCategory(assignment.getPositionKpi().getCategory());
        record.setTarget(assignment.getPositionKpi().getTarget());
        record.setUnit(assignment.getPositionKpi().getUnit());
        record.setWeight(assignment.getPositionKpi().getWeight());
        record.setPriorityLevel(assignment.getPositionKpi().getPriorityLevel());
        record.setActualValue(assignment.getActualValue());
        record.setWeightedScore(assignment.getWeightedScore());
        record.setScore(assignment.getScore());
        record.setLogicDirection(assignment.getPositionKpi().getLogicDirection());
        record.setStatus(assignment.getIsLocked() ? KpiStatus.LOCKED : KpiStatus.DRAFT);
        record.setRemarks(assignment.getRemarks());
        
        if (updater != null) {
            record.setUpdatedBy(updater);
            record.setUpdatedDate(Instant.now());
            if (record.getId() == null) {
                record.setCreatedBy(updater);
                record.setCreatedDate(Instant.now());
                record.setRevisionNumber(0);
            } else {
                Integer currentRevision = record.getRevisionNumber();
                record.setRevisionNumber(currentRevision != null ? currentRevision + 1 : 1);
            }
        } else if (assignment.getIsLocked() != null && assignment.getIsLocked()) {
            record.setLockedDate(Instant.now());
        }

        kpiRecordRepository.save(record);
    }

    // ==================== Bulk Operations ====================
    
 // In KpiManagementService.java - Updated assignKpisToEmployee method

    @Transactional
    public List<EmployeeKpiAssignment> assignKpisToEmployee(Long employeeId, Long periodId, List<Long> positionKpiIds) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        
        AppraisalCycle period = kpiPeriodRepository.findById(periodId)
                .orElseThrow(() -> new RuntimeException("Period not found"));
        
        List<EmployeeKpiAssignment> assignments = new ArrayList<>();
        
        for (Long kpiId : positionKpiIds) {
            PositionKpiDefinition kpiDef = positionKpiDefinitionRepository.findById(kpiId)
                    .orElseThrow(() -> new RuntimeException("KPI definition not found: " + kpiId));
            
            // Check if already assigned - using the repository method
            Optional<EmployeeKpiAssignment> existing = employeeKpiAssignmentRepository
                    .findByEmployeeIdAndPeriodIdAndPositionKpiId(employeeId, periodId, kpiId);
            
            if (existing.isEmpty()) {
                EmployeeKpiAssignment assignment = new EmployeeKpiAssignment();
                assignment.setEmployee(employee);
                assignment.setPeriod(period);
                assignment.setPositionKpi(kpiDef);
                assignment.setStatus("ASSIGNED");
                assignment.setIsLocked(false);
                assignment.setCreatedDate(Instant.now());
                assignment.setUpdatedDate(Instant.now());
                assignments.add(employeeKpiAssignmentRepository.save(assignment));
            } else {
                log.info("KPI {} already assigned to employee {} for period {}", kpiId, employeeId, periodId);
            }
        }
        
        log.info("Assigned {} new KPIs to employee ID: {} for period ID: {}", assignments.size(), employeeId, periodId);
        return assignments;
    }

    public BigDecimal getEmployeeTotalWeight(Long employeeId, Long periodId) {
        List<EmployeeKpiAssignment> assignments = employeeKpiAssignmentRepository.findByEmployeeIdAndPeriodId(employeeId, periodId);
        return assignments.stream()
                .map(a -> a.getPositionKpi().getWeight())
                .filter(w -> w != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal getEmployeeTotalScore(Long employeeId, Long periodId) {
        List<EmployeeKpiAssignment> assignments = employeeKpiAssignmentRepository.findByEmployeeIdAndPeriodId(employeeId, periodId);
        return assignments.stream()
                .map(EmployeeKpiAssignment::getWeightedScore)
                .filter(s -> s != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}