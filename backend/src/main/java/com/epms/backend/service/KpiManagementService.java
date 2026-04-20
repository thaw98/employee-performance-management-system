package com.epms.backend.service;

import com.epms.backend.dto.kpi.PositionKpiDto;
import com.epms.backend.dto.kpi.PositionKpiRequestDto;
import com.epms.backend.entity.*;
import com.epms.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
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

    // Categories
    public List<KpiCategory> getAllCategories() {
        return kpiCategoryRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
    }

    public KpiCategory createCategory(String name) {
        KpiCategory category = new KpiCategory();
        category.setName(name);
        return kpiCategoryRepository.save(category);
    }

    // Position KPI Definitions
    public List<PositionKpiDefinition> getPositionKpis(Long positionId) {
        return positionKpiDefinitionRepository.findByPositionIdOrderByDisplayOrderAsc(positionId);
    }

    @Transactional
    public List<PositionKpiDefinition> savePositionKpis(PositionKpiRequestDto request) {
        // Validate total weight
        BigDecimal totalWeight = request.getKpis().stream()
                .map(PositionKpiDto::getWeight)
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
            PositionKpiDefinition def = new PositionKpiDefinition();
            def.setPosition(positionRepository.findById(request.getPositionId())
                    .orElseThrow(() -> new RuntimeException("Position not found")));
            def.setKpiName(dto.getKpiName());
            def.setCategory(dto.getCategory());
            def.setTarget(dto.getTarget());
            def.setUnit(dto.getUnit());
            def.setWeight(dto.getWeight());
            def.setPriorityLevel(dto.getPriorityLevel());
            def.setLogicDirection(dto.getLogicDirection());
            def.setDisplayOrder(order++);
            def.setIsActive(true);
            savedKpis.add(positionKpiDefinitionRepository.save(def));
        }

        return savedKpis;
    }

    public void deletePositionKpi(Long kpiId) {
        positionKpiDefinitionRepository.deleteById(kpiId);
    }

    // Employee KPI Assignment
    @Transactional
    public List<EmployeeKpiAssignment> assignKpisToEmployee(Long employeeId, Long periodId, List<Long> positionKpiIds) {
        List<EmployeeKpiAssignment> assignments = new ArrayList<>();
        for (Long kpiId : positionKpiIds) {
            EmployeeKpiAssignment assignment = new EmployeeKpiAssignment();
            assignment.setEmployee(new Employee() {{ setId(employeeId); }});
            assignment.setPeriod(new KpiPeriod() {{ setId(periodId); }});
            assignment.setPositionKpi(positionKpiDefinitionRepository.findById(kpiId).orElse(null));
            assignment.setStatus("ASSIGNED");
            assignments.add(employeeKpiAssignmentRepository.save(assignment));
        }
        return assignments;
    }

    public List<PositionKpiDto> getPositionKpisWithPositionName(Long positionId) {
        Position position = positionRepository.findById(positionId).orElse(null);
        List<PositionKpiDefinition> definitions = positionKpiDefinitionRepository.findByPositionIdOrderByDisplayOrderAsc(positionId);
        
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

    public List<Position> getAllPositions() {
        return positionRepository.findAll();
    }

    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    public List<PositionKpiDto> getEmployeeKpisWithActuals(Long employeeId) {
        // Get active or latest period
        KpiPeriod period = kpiPeriodRepository.findAll().stream()
                .filter(p -> "Active".equalsIgnoreCase(p.getStatus()))
                .findFirst()
                .orElse(kpiPeriodRepository.findAll().stream().findFirst().orElse(null));

        if (period == null) return new ArrayList<>();

        List<EmployeeKpiAssignment> assignments = employeeKpiAssignmentRepository.findByEmployeeIdAndPeriodId(employeeId, period.getId());
        
        return assignments.stream().map(a -> PositionKpiDto.builder()
                .id(a.getPositionKpi().getId())
                .assignmentId(a.getId())
                .kpiName(a.getPositionKpi().getKpiName())
                .category(a.getPositionKpi().getCategory())
                .target(a.getPositionKpi().getTarget())
                .unit(a.getPositionKpi().getUnit())
                .weight(a.getPositionKpi().getWeight())
                .priorityLevel(a.getPositionKpi().getPriorityLevel())
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
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findAll().stream()
                .filter(u -> currentUsername.equals(u.getEmail()))
                .findFirst().orElseThrow(() -> new RuntimeException("Logged in user not found"));

        Employee targetEmployee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        // Rule: Manager/HR can only update for employees in the same department
        boolean isHR = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_HR"));
        
        if (!isHR && !currentUser.getEmployee().getDepartment().getId().equals(targetEmployee.getDepartment().getId())) {
            throw new RuntimeException("Access denied: You can only update KPIs for employees in your department");
        }

        for (PositionKpiDto update : updates) {
            if (update.getAssignmentId() == null) continue;
            
            EmployeeKpiAssignment assignment = employeeKpiAssignmentRepository.findById(update.getAssignmentId())
                    .orElseThrow(() -> new RuntimeException("KPI assignment not found"));

            if (Boolean.TRUE.equals(assignment.getIsLocked())) {
                throw new RuntimeException("Cannot update locked KPI: " + assignment.getPositionKpi().getKpiName());
            }

            assignment.setActualValue(update.getActualValue());
            assignment.setRemarks(update.getRemarks());
            assignment.setUpdatedBy(currentUser.getEmployee().getEmployeeName());

            // Simple Scoring Logic
            try {
                BigDecimal target = new BigDecimal(assignment.getPositionKpi().getTarget().replaceAll("[^0-9.]", ""));
                BigDecimal weight = assignment.getPositionKpi().getWeight();
                BigDecimal actual = assignment.getActualValue();

                if (target.compareTo(BigDecimal.ZERO) > 0 && actual != null) {
                    BigDecimal baseScore;
                    if ("higher".equalsIgnoreCase(assignment.getPositionKpi().getLogicDirection())) {
                        baseScore = actual.divide(target, 4, BigDecimal.ROUND_HALF_UP).multiply(new BigDecimal("100"));
                    } else {
                        baseScore = target.divide(actual, 4, BigDecimal.ROUND_HALF_UP).multiply(new BigDecimal("100"));
                    }
                    assignment.setScore(baseScore);
                    assignment.setWeightedScore(baseScore.multiply(weight).divide(new BigDecimal("100"), 2, BigDecimal.ROUND_HALF_UP));
                }
            } catch (Exception e) {
                log.warn("Could not calculate score for KPI {}: {}", assignment.getPositionKpi().getKpiName(), e.getMessage());
            }

            employeeKpiAssignmentRepository.save(assignment);
        }
    }

    @Transactional
    public void lockEmployeeKpis(Long employeeId) {
        // Only HR can lock (Controller check protects this, but service should be robust)
        KpiPeriod period = kpiPeriodRepository.findAll().stream()
                .filter(p -> "Active".equalsIgnoreCase(p.getStatus()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No active KPI period found"));

        List<EmployeeKpiAssignment> assignments = employeeKpiAssignmentRepository.findByEmployeeIdAndPeriodId(employeeId, period.getId());
        for (EmployeeKpiAssignment assignment : assignments) {
            assignment.setIsLocked(true);
            employeeKpiAssignmentRepository.save(assignment);
        }
    }
}
