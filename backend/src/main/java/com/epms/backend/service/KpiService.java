package com.epms.backend.service;

import com.epms.backend.entity.Employee;
import com.epms.backend.entity.EmployeeKpi;
import com.epms.backend.entity.PositionKpi;
import com.epms.backend.entity.DepartmentKpi;
import com.epms.backend.dto.KpiDto;
import com.epms.backend.dto.PositionKpiDto;
import com.epms.backend.dto.DepartmentKpiDto;
import com.epms.backend.entity.Department;
import com.epms.backend.entity.Position;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.KpiRepository;
import com.epms.backend.repository.PositionKpiRepository;
import com.epms.backend.repository.DepartmentKpiRepository;
import com.epms.backend.repository.DepartmentRepository;
import com.epms.backend.repository.PositionRepository;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.repository.DepartmentPositionRepository;
import com.epms.backend.dto.hr.PositionKpiStatusDto;
import com.epms.backend.dto.hr.DepartmentKpiStatusDto;
import com.epms.backend.entity.DepartmentPosition;
import com.epms.backend.repository.AppraisalAssignmentRepository;
import com.epms.backend.entity.AppraisalStatus;
import com.epms.backend.audit.AuditActionType;
import com.epms.backend.audit.AuditTargetType;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.epms.backend.entity.User;

@Service
public class KpiService {

    private final KpiRepository kpiRepository;
    private final EmployeeRepository employeeRepository;
    private final PositionKpiRepository positionKpiRepository;
    private final DepartmentKpiRepository departmentKpiRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final UserRepository userRepository;
    private final DepartmentPositionRepository departmentPositionRepository;
    private final AuditService auditService;
    private final AppraisalAssignmentRepository appraisalAssignmentRepository;

    public KpiService(KpiRepository kpiRepository,
            EmployeeRepository employeeRepository,
            PositionKpiRepository positionKpiRepository,
            DepartmentKpiRepository departmentKpiRepository,
            DepartmentRepository departmentRepository,
            PositionRepository positionRepository,
            UserRepository userRepository,
            DepartmentPositionRepository departmentPositionRepository,
            AuditService auditService,
            AppraisalAssignmentRepository appraisalAssignmentRepository) {
        this.kpiRepository = kpiRepository;
        this.employeeRepository = employeeRepository;
        this.positionKpiRepository = positionKpiRepository;
        this.departmentKpiRepository = departmentKpiRepository;
        this.departmentRepository = departmentRepository;
        this.positionRepository = positionRepository;
        this.userRepository = userRepository;
        this.departmentPositionRepository = departmentPositionRepository;
        this.auditService = auditService;
        this.appraisalAssignmentRepository = appraisalAssignmentRepository;
    }

    public List<KpiDto> getKpisByEmployeeAndPeriod(Long employeeId, String period) {
        return kpiRepository.findByEmployee_IdAndPeriod(employeeId, period)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<String> getEmployeeKpiPeriods(Long employeeId) {
        return kpiRepository.findDistinctPeriodsByEmployee_IdOrderByPeriodDesc(employeeId);
    }

    public List<KpiDto> getLatestKpisByEmployee(Long employeeId) {
        return kpiRepository.findLatestPeriodByEmployee_Id(employeeId)
                .map(period -> getKpisByEmployeeAndPeriod(employeeId, period))
                .orElse(List.of());
    }

    public List<KpiDto> getMyLatestKpis(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        if (user.getEmployee() == null)
            return List.of();
        return getLatestKpisByEmployee(user.getEmployee().getId());
    }

    public java.time.Instant getLatestUpdatedDate(Long employeeId) {
        return kpiRepository.findLatestUpdatedDateByEmployeeId(employeeId).orElse(null);
    }

    @Transactional
    public List<KpiDto> saveKpis(List<KpiDto> kpiDtos, Long performerUserId) {
        if (kpiDtos.isEmpty())
            return List.of();

        BigDecimal totalWeight = kpiDtos.stream()
                .map(KpiDto::getWeight)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalWeight.compareTo(new BigDecimal("100")) != 0) {
            throw new IllegalArgumentException("Total weight must equal 100%");
        }

        Long employeeId = kpiDtos.get(0).getEmployeeId();
        String period = kpiDtos.get(0).getPeriod();

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        User performer = userRepository.findById(performerUserId).orElseThrow();

        // Soft delete: Archive existing active KPIs for this specific employee and
        // period
        List<EmployeeKpi> existingActive = kpiRepository.findByEmployee_IdAndPeriodAndRecordStatus(employeeId, period,
                "Active");
        for (EmployeeKpi k : existingActive) {
            k.setRecordStatus("Archived");
        }
        kpiRepository.saveAll(existingActive);

        List<EmployeeKpi> kpis = kpiDtos.stream().map(dto -> {
            EmployeeKpi kpi = new EmployeeKpi();
            kpi.setEmployee(employee);
            kpi.setName(dto.getName());
            kpi.setCategory(dto.getCategory());
            kpi.setTarget(dto.getTarget());
            kpi.setUnit(dto.getUnit());
            kpi.setActual(dto.getActual());
            kpi.setWeight(dto.getWeight());
            kpi.setScore(dto.getScore());
            kpi.setWeightedScore(dto.getWeightedScore());
            kpi.setPeriod(dto.getPeriod());
            kpi.setStatus(dto.getStatus() != null ? dto.getStatus() : "SUBMITTED");
            kpi.setRecordStatus("Active");
            return kpi;
        }).collect(Collectors.toList());

        kpiRepository.saveAll(kpis);

        String metadata = null;
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            metadata = mapper.writeValueAsString(kpiDtos);
        } catch (Exception e) {}

        auditService.record(AuditActionType.KPI_CREATED, AuditTargetType.EMPLOYEE_KPI, employeeId, performerUserId,
                performer.getRole().getId(),
                "KPIs set up for " + employee.getEmployeeName() + " for period " + period,
                metadata);

        return getKpisByEmployeeAndPeriod(employeeId, period);
    }

    @Transactional
    public List<KpiDto> updateKpiActualsByManager(Long managerUserId, Long employeeId, List<KpiDto> kpiUpdates) {
        if (kpiUpdates == null || kpiUpdates.isEmpty())
            return List.of();

        User managerUser = userRepository.findById(managerUserId)
                .orElseThrow(() -> new RuntimeException("Manager user not found"));
        Employee manager = managerUser.getEmployee();
        if (manager == null)
            throw new RuntimeException("Manager employee not found");

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        if (manager.getDepartment() == null || employee.getDepartment() == null ||
                !manager.getDepartment().getId().equals(employee.getDepartment().getId())) {
            throw new IllegalArgumentException("Manager can only update KPIs for employees in the same department");
        }

        // Check if appraisal is finalized (LOCKED) for this period
        appraisalAssignmentRepository.findByEmployee_IdAndPeriod_Name(employeeId, kpiUpdates.get(0).getPeriod())
                .ifPresent(appraisal -> {
                    if (appraisal.getStatus() == AppraisalStatus.LOCKED) {
                        throw new IllegalStateException("Cannot update KPIs for a finalized appraisal period.");
                    }
                });

        List<EmployeeKpi> updatedKpis = new ArrayList<>();
        String status = kpiUpdates.get(0).getStatus();
        if (status == null || status.isBlank()) {
            status = "SUBMITTED";
        }

        for (KpiDto update : kpiUpdates) {
            if (update.getId() == null)
                continue;

            EmployeeKpi kpi = kpiRepository.findById(update.getId())
                    .orElseThrow(() -> new RuntimeException("KPI not found"));

            if (!kpi.getEmployee().getId().equals(employeeId)) {
                throw new IllegalArgumentException("KPI does not belong to the specified employee");
            }

            // Validation: Actual value is required for submission
            if ("SUBMITTED".equals(status) && (update.getActual() == null || update.getActual().trim().isEmpty())) {
                throw new IllegalArgumentException("Actual value is required for all KPIs when submitting");
            }

            // Validation: Score range check
            if (update.getScore() != null) {
                if (update.getScore().compareTo(BigDecimal.ZERO) < 0 || update.getScore().compareTo(new BigDecimal("100")) > 0) {
                    throw new IllegalArgumentException("Score for '" + kpi.getName() + "' must be between 0 and 100");
                }
            }

            kpi.setActual(update.getActual());
            if (update.getScore() != null) {
                kpi.setScore(update.getScore());
            }
            if (update.getWeightedScore() != null) {
                kpi.setWeightedScore(update.getWeightedScore());
            }
            kpi.setStatus(status);

            updatedKpis.add(kpi);
        }

        kpiRepository.saveAll(updatedKpis);

        String action = "DRAFT".equals(status) ? AuditActionType.KPI_DRAFT_SAVED : AuditActionType.KPI_SUBMITTED;
        
        // Prepare metadata for changes
        String metadata = null;
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            metadata = mapper.writeValueAsString(kpiUpdates);
        } catch (Exception e) {
            // Ignore mapping errors
        }

        auditService.record(action, AuditTargetType.EMPLOYEE_KPI, employeeId, managerUserId, managerUser.getRole().getId(),
                "Manager " + manager.getEmployeeName() + " "
                        + (action.equals(AuditActionType.KPI_DRAFT_SAVED) ? "saved draft" : "submitted") + " KPI actuals for "
                        + employee.getEmployeeName(),
                metadata);

        return kpiRepository.findByEmployee_IdAndPeriod(employeeId, kpiUpdates.get(0).getPeriod())
                .stream().map(this::convertToDto).collect(Collectors.toList());
    }

    public List<java.util.Map<String, Object>> getManagerTeam(Long managerUserId) {
        User managerUser = userRepository.findById(managerUserId).orElseThrow();
        Employee manager = managerUser.getEmployee();
        if (manager == null || manager.getDepartment() == null) {
            return List.of();
        }

        List<Employee> team = employeeRepository.findByDepartmentId(manager.getDepartment().getId());
        return team.stream()
                .filter(e -> !e.getId().equals(manager.getId()))
                .map(e -> {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", e.getId());
                    map.put("name", e.getEmployeeName());
                    map.put("role", e.getPosition() != null ? e.getPosition().getName() : "");

                    // Get status from latest KPI if exists
                    String status = kpiRepository.findLatestPeriodByEmployee_Id(e.getId())
                            .flatMap(period -> kpiRepository.findByEmployee_IdAndPeriod(e.getId(), period).stream()
                                    .findFirst())
                            .map(k -> k.getStatus())
                            .orElse("PENDING");

                    map.put("status", status);
                    return map;
                }).collect(Collectors.toList());
    }

    public List<PositionKpiDto> getPositionKpis(Long departmentId, Long positionId, String period) {
        return positionKpiRepository.findByDepartment_IdAndPosition_IdAndPeriod(departmentId, positionId, period)
                .stream()
                .map(this::convertToPositionDto)
                .collect(Collectors.toList());
    }

    public List<DepartmentKpiDto> getDepartmentKpis(Long departmentId, String period) {
        return departmentKpiRepository.findByDepartmentIdAndPeriod(departmentId, period)
                .stream()
                .map(this::convertToDepartmentDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<PositionKpiDto> savePositionKpis(List<PositionKpiDto> dtoList, Long performerUserId) {
        if (dtoList.isEmpty())
            return List.of();

        BigDecimal totalWeight = dtoList.stream()
                .map(PositionKpiDto::getWeight)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalWeight.compareTo(new BigDecimal("100")) != 0) {
            throw new IllegalArgumentException("Total weight must equal 100%");
        }

        Long deptId = dtoList.get(0).getDepartmentId();
        Long posId = dtoList.get(0).getPositionId();
        String period = dtoList.get(0).getPeriod();

        // Soft delete: Archive existing active position KPIs
        List<PositionKpi> existingActive = positionKpiRepository
                .findByDepartmentIdAndPositionIdAndPeriodAndRecordStatus(deptId, posId, period, "Active");
        for (PositionKpi k : existingActive) {
            k.setRecordStatus("Archived");
        }
        positionKpiRepository.saveAll(existingActive);

        Department dept = departmentRepository.findById(deptId).orElseThrow();
        Position pos = positionRepository.findById(posId).orElseThrow();
        User performer = userRepository.findById(performerUserId).orElseThrow();

        List<PositionKpi> entities = dtoList.stream().map(dto -> {
            PositionKpi entity = new PositionKpi();
            entity.setDepartment(dept);
            entity.setPosition(pos);
            entity.setName(dto.getName());
            entity.setCategory(dto.getCategory());
            entity.setTarget(dto.getTarget());
            entity.setUnit(dto.getUnit());
            entity.setWeight(dto.getWeight());
            entity.setPeriod(dto.getPeriod());
            entity.setRecordStatus("Active");
            return entity;
        }).collect(Collectors.toList());

        List<PositionKpi> saved = positionKpiRepository.saveAll(entities);

        // After saving the template, apply it to all employees in this department and
        // position
        applyToEmployees(deptId, posId, period, saved);

        String metadata = null;
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            metadata = mapper.writeValueAsString(dtoList);
        } catch (Exception e) {}

        auditService.record(AuditActionType.KPI_CREATED, AuditTargetType.POSITION_KPI, posId, performerUserId,
                performer.getRole().getId(),
                "Position KPIs set up for " + pos.getName() + " in " + dept.getName() + " for period " + period,
                metadata);

        return saved.stream().map(this::convertToPositionDto).collect(Collectors.toList());
    }

    @Transactional
    public List<DepartmentKpiDto> saveDepartmentKpis(List<DepartmentKpiDto> dtoList, Long performerUserId) {
        if (dtoList.isEmpty())
            return List.of();

        BigDecimal totalWeight = dtoList.stream()
                .map(DepartmentKpiDto::getWeight)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalWeight.compareTo(new BigDecimal("100")) != 0) {
            throw new IllegalArgumentException("Total weight must equal 100%");
        }

        Long deptId = dtoList.get(0).getDepartmentId();
        String period = dtoList.get(0).getPeriod();

        // Soft delete: Archive existing active department KPIs
        List<DepartmentKpi> existingActive = departmentKpiRepository.findByDepartmentIdAndPeriodAndRecordStatus(deptId,
                period, "Active");
        for (DepartmentKpi k : existingActive) {
            k.setRecordStatus("Archived");
        }
        departmentKpiRepository.saveAll(existingActive);

        Department dept = departmentRepository.findById(deptId).orElseThrow();
        User performer = userRepository.findById(performerUserId).orElseThrow();

        List<DepartmentKpi> entities = dtoList.stream().map(dto -> {
            DepartmentKpi entity = new DepartmentKpi();
            entity.setDepartment(dept);
            entity.setName(dto.getName());
            entity.setCategory(dto.getCategory());
            entity.setTarget(dto.getTarget());
            entity.setUnit(dto.getUnit());
            entity.setWeight(dto.getWeight());
            entity.setPeriod(dto.getPeriod());
            entity.setRecordStatus("Active");
            return entity;
        }).collect(Collectors.toList());

        List<DepartmentKpi> saved = departmentKpiRepository.saveAll(entities);

        String metadata = null;
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            metadata = mapper.writeValueAsString(dtoList);
        } catch (Exception e) {}

        auditService.record(AuditActionType.KPI_CREATED, AuditTargetType.DEPARTMENT_KPI, deptId, performerUserId,
                performer.getRole().getId(),
                "Department KPIs set up for " + dept.getName() + " for period " + period,
                metadata);

        return saved.stream().map(this::convertToDepartmentDto).collect(Collectors.toList());
    }

    private void applyToEmployees(Long deptId, Long posId, String period, List<PositionKpi> templates) {
        List<Employee> employees = employeeRepository.findByDepartment_IdAndPosition_Id(deptId, posId);

        for (Employee emp : employees) {
            // Soft delete: Archive existing active KPIs for this employee and period
            List<EmployeeKpi> existingActive = kpiRepository.findByEmployee_IdAndPeriodAndRecordStatus(emp.getId(),
                    period, "Active");
            for (EmployeeKpi k : existingActive) {
                k.setRecordStatus("Archived");
            }
            kpiRepository.saveAll(existingActive);

            List<EmployeeKpi> newKpis = templates.stream().map(t -> {
                EmployeeKpi kpi = new EmployeeKpi();
                kpi.setEmployee(emp);
                kpi.setName(t.getName());
                kpi.setCategory(t.getCategory());
                kpi.setTarget(t.getTarget());
                kpi.setUnit(t.getUnit());
                kpi.setWeight(t.getWeight());
                kpi.setPeriod(t.getPeriod());
                kpi.setStatus("SUBMITTED");
                kpi.setRecordStatus("Active");
                return kpi;
            }).collect(Collectors.toList());

            kpiRepository.saveAll(newKpis);
        }
    }

    public List<PositionKpiStatusDto> getPositionsKpiStatus(Long departmentId, String period) {
        List<DepartmentPosition> activeMappings = departmentId != null
                ? departmentPositionRepository.findActiveByDepartmentIdWithPosition(departmentId)
                : departmentPositionRepository.findAllActiveWithPosition();

        Set<String> keysWithKpis = positionKpiRepository.findDistinctDeptAndPosWithActiveKpis(period);

        return activeMappings.stream().map(dp -> {
            String key = dp.getDepartment().getId() + "-" + dp.getPosition().getId();
            return PositionKpiStatusDto.builder()
                    .departmentId(dp.getDepartment().getId())
                    .departmentName(dp.getDepartment().getName())
                    .positionId(dp.getPosition().getId())
                    .positionName(dp.getPosition().getName())
                    .hasKpis(keysWithKpis.contains(key))
                    .build();
        }).collect(Collectors.toList());
    }

    public List<DepartmentKpiStatusDto> getDepartmentsKpiStatus(String period) {
        List<Department> activeDepartments = departmentRepository.findAll().stream()
                .filter(d -> d.getStatus() == null || "active".equalsIgnoreCase(d.getStatus().trim()))
                .collect(Collectors.toList());

        Set<Long> idsWithKpis = departmentKpiRepository.findDistinctDeptWithActiveKpis(period);

        return activeDepartments.stream().map(d -> {
            return DepartmentKpiStatusDto.builder()
                    .departmentId(d.getId())
                    .departmentName(d.getName())
                    .hasKpis(idsWithKpis.contains(d.getId()))
                    .build();
        }).collect(Collectors.toList());
    }

    public List<KpiDto> getEmployeeKpiHistory(Long employeeId, String period) {
        return kpiRepository.findHistory(employeeId, period)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<PositionKpiDto> getPositionKpiHistory(Long departmentId, Long positionId, String period) {
        return positionKpiRepository.findHistory(departmentId, positionId, period)
                .stream()
                .map(this::convertToPositionDto)
                .collect(Collectors.toList());
    }

    public List<DepartmentKpiDto> getDepartmentKpiHistory(Long departmentId, String period) {
        return departmentKpiRepository.findHistory(departmentId, period)
                .stream()
                .map(this::convertToDepartmentDto)
                .collect(Collectors.toList());
    }

    public List<com.epms.backend.dto.KpiHistorySummaryDto> getAllKpiHistorySummary() {
        return kpiRepository.findHistorySummary();
    }


    private KpiDto convertToDto(EmployeeKpi kpi) {
        KpiDto dto = new KpiDto();
        dto.setId(kpi.getId());
        dto.setEmployeeId(kpi.getEmployee().getId());
        dto.setEmployeeName(kpi.getEmployee().getEmployeeName());
        dto.setName(kpi.getName());
        dto.setCategory(kpi.getCategory());
        dto.setTarget(kpi.getTarget());
        dto.setUnit(kpi.getUnit());
        dto.setActual(kpi.getActual());
        dto.setWeight(kpi.getWeight());
        dto.setScore(kpi.getScore());
        dto.setWeightedScore(kpi.getWeightedScore());
        dto.setPeriod(kpi.getPeriod());
        dto.setStatus(kpi.getStatus());
        dto.setRecordStatus(kpi.getRecordStatus());
        dto.setCreatedDate(kpi.getCreatedDate());
        dto.setUpdatedDate(kpi.getUpdatedDate());
        return dto;
    }

    private PositionKpiDto convertToPositionDto(PositionKpi entity) {
        PositionKpiDto dto = new PositionKpiDto();
        dto.setId(entity.getId());
        dto.setDepartmentId(entity.getDepartment().getId());
        dto.setPositionId(entity.getPosition().getId());
        dto.setName(entity.getName());
        dto.setCategory(entity.getCategory());
        dto.setTarget(entity.getTarget());
        dto.setUnit(entity.getUnit());
        dto.setWeight(entity.getWeight());
        dto.setPeriod(entity.getPeriod());
        dto.setRecordStatus(entity.getRecordStatus());
        dto.setCreatedDate(entity.getCreatedDate());
        dto.setUpdatedDate(entity.getUpdatedDate());
        return dto;
    }

    private DepartmentKpiDto convertToDepartmentDto(DepartmentKpi entity) {
        DepartmentKpiDto dto = new DepartmentKpiDto();
        dto.setId(entity.getId());
        dto.setDepartmentId(entity.getDepartment().getId());
        dto.setName(entity.getName());
        dto.setCategory(entity.getCategory());
        dto.setTarget(entity.getTarget());
        dto.setUnit(entity.getUnit());
        dto.setWeight(entity.getWeight());
        dto.setPeriod(entity.getPeriod());
        dto.setRecordStatus(entity.getRecordStatus());
        dto.setCreatedDate(entity.getCreatedDate());
        dto.setUpdatedDate(entity.getUpdatedDate());
        return dto;
    }
}
