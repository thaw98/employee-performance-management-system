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
import java.util.Objects;
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
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    public KpiService(KpiRepository kpiRepository,
            EmployeeRepository employeeRepository,
            PositionKpiRepository positionKpiRepository,
            DepartmentKpiRepository departmentKpiRepository,
            DepartmentRepository departmentRepository,
            PositionRepository positionRepository,
            UserRepository userRepository,
            DepartmentPositionRepository departmentPositionRepository,
            AuditService auditService,
            AppraisalAssignmentRepository appraisalAssignmentRepository,
            org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
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
        this.jdbcTemplate = jdbcTemplate;
    }

    private boolean isFuturePeriod(String period) {
        if (period == null || period.isBlank()) {
            return false;
        }
        try {
            java.time.YearMonth currentYM = java.time.YearMonth.now();
            java.time.YearMonth periodYM;
            if (period.matches("\\d{4}-\\d{2}")) {
                periodYM = java.time.YearMonth.parse(period);
            } else {
                java.time.format.DateTimeFormatter formatter = new java.time.format.DateTimeFormatterBuilder()
                        .appendPattern("MMMM yyyy")
                        .toFormatter(java.util.Locale.ENGLISH);
                periodYM = java.time.YearMonth.parse(period, formatter);
            }
            return periodYM.isAfter(currentYM);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isHrOrAudit(Long roleId) {
        return roleId != null && (roleId == 1L || roleId == 5L);
    }

    public List<KpiDto> getKpisByEmployeeAndPeriod(Long employeeId, String period) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.epms.backend.security.UserPrincipal principal) {
            Long roleId = principal.getRoleId();
            Long currentEmployeeId = principal.getEmployeeDbId();
            
            if (isHrOrAudit(roleId)) {
                // Allowed
            } else if (roleId == 2L || roleId == 3L) { // MANAGER
                if (isFuturePeriod(period)) {
                    throw new org.springframework.security.access.AccessDeniedException("Access denied: Managers cannot view future KPI records.");
                }
                if (!Objects.equals(employeeId, currentEmployeeId)) {
                    Employee mgr = employeeRepository.findById(currentEmployeeId).orElse(null);
                    Employee target = employeeRepository.findById(employeeId).orElse(null);
                    if (mgr == null || target == null || mgr.getDepartment() == null || target.getDepartment() == null ||
                        !mgr.getDepartment().getId().equals(target.getDepartment().getId())) {
                        throw new org.springframework.security.access.AccessDeniedException("Access denied: Managers can only view KPI records of their team members.");
                    }
                }
            } else if (roleId == 4L) { // EMPLOYEE
                if (isFuturePeriod(period)) {
                    throw new org.springframework.security.access.AccessDeniedException("Access denied: Employees cannot view future KPI records.");
                }
                if (!Objects.equals(employeeId, currentEmployeeId)) {
                    throw new org.springframework.security.access.AccessDeniedException("Access denied: Employees can only view their own KPI records.");
                }
            } else {
                throw new org.springframework.security.access.AccessDeniedException("Access denied: Invalid role.");
            }
        }
        return kpiRepository.findByEmployee_IdAndPeriod(employeeId, period)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<String> getEmployeeKpiPeriods(Long employeeId) {
        List<String> allPeriods = kpiRepository.findDistinctPeriodsByEmployee_IdOrderByPeriodDesc(employeeId);
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.epms.backend.security.UserPrincipal principal) {
            Long roleId = principal.getRoleId();
            Long currentEmployeeId = principal.getEmployeeDbId();
            if (isHrOrAudit(roleId)) {
                return allPeriods;
            }
            if (roleId == 2L || roleId == 3L) { // MANAGER
                if (!Objects.equals(employeeId, currentEmployeeId)) {
                    Employee mgr = employeeRepository.findById(currentEmployeeId).orElse(null);
                    Employee target = employeeRepository.findById(employeeId).orElse(null);
                    if (mgr == null || target == null || mgr.getDepartment() == null || target.getDepartment() == null ||
                        !mgr.getDepartment().getId().equals(target.getDepartment().getId())) {
                        throw new org.springframework.security.access.AccessDeniedException("Access denied: Managers can only view KPI periods of their team members.");
                    }
                }
            } else if (roleId == 4L) { // EMPLOYEE
                if (!Objects.equals(employeeId, currentEmployeeId)) {
                    throw new org.springframework.security.access.AccessDeniedException("Access denied: Employees can only view their own KPI periods.");
                }
            }
            return allPeriods.stream()
                    .filter(p -> !isFuturePeriod(p))
                    .collect(Collectors.toList());
        }
        return allPeriods;
    }

    public List<KpiDto> getLatestKpisByEmployee(Long employeeId) {
        String latestPeriod = null;
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.epms.backend.security.UserPrincipal principal) {
            Long roleId = principal.getRoleId();
            if (isHrOrAudit(roleId)) {
                latestPeriod = kpiRepository.findLatestPeriodByEmployee_Id(employeeId).orElse(null);
            } else {
                List<String> allowedPeriods = kpiRepository.findDistinctPeriodsByEmployee_IdOrderByPeriodDesc(employeeId)
                        .stream()
                        .filter(p -> !isFuturePeriod(p))
                        .collect(Collectors.toList());
                if (!allowedPeriods.isEmpty()) {
                    latestPeriod = allowedPeriods.get(0);
                }
            }
        } else {
            latestPeriod = kpiRepository.findLatestPeriodByEmployee_Id(employeeId).orElse(null);
        }
        if (latestPeriod == null) {
            return List.of();
        }
        return getKpisByEmployeeAndPeriod(employeeId, latestPeriod);
    }

    public List<KpiDto> getMyLatestKpis(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        if (user.getEmployee() == null)
            return List.of();
        return getLatestKpisByEmployee(user.getEmployee().getId());
    }

    public java.time.Instant getLatestUpdatedDate(Long employeeId) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.epms.backend.security.UserPrincipal principal) {
            Long roleId = principal.getRoleId();
            if (!isHrOrAudit(roleId)) {
                List<String> allowedPeriods = kpiRepository.findDistinctPeriodsByEmployee_IdOrderByPeriodDesc(employeeId)
                        .stream()
                        .filter(p -> !isFuturePeriod(p))
                        .collect(Collectors.toList());
                if (allowedPeriods.isEmpty()) {
                    return null;
                }
                return kpiRepository.findByEmployee_IdAndPeriod(employeeId, allowedPeriods.get(0))
                        .stream()
                        .map(EmployeeKpi::getUpdatedDate)
                        .filter(Objects::nonNull)
                        .max(java.util.Comparator.naturalOrder())
                        .orElse(null);
            }
        }
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
        KpiDto firstDto = kpiDtos.get(0);
        validateYearMonth(firstDto.getYear(), firstDto.getMonth());
        if (!kpiDtos.stream().allMatch(dto -> Objects.equals(dto.getYear(), firstDto.getYear())
                && Objects.equals(dto.getMonth(), firstDto.getMonth()))) {
            throw new IllegalArgumentException("All KPI records must use the same month and year.");
        }
        String period = resolvePeriodString(firstDto.getPeriod(), firstDto.getYear(), firstDto.getMonth(),
                firstDto.getPeriodLabel());

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        User performer = userRepository.findById(performerUserId).orElseThrow();

        // Check if active KPIs already exist for this employee and period
        List<EmployeeKpi> existingActive = kpiRepository.findByEmployee_IdAndPeriodAndRecordStatus(employeeId, period,
                "Active");
        if (!existingActive.isEmpty()) {
            throw new IllegalStateException("KPIs are already defined for " + employee.getEmployeeName()
                    + " for period " + period + ". Overwriting is not allowed.");
        }

        List<EmployeeKpi> kpis = kpiDtos.stream().map(dto -> {
            EmployeeKpi kpi = new EmployeeKpi();
            kpi.setEmployee(employee);
            kpi.setName(dto.getName());
            kpi.setCategory(dto.getCategory());
            kpi.setTarget(dto.getTarget());
            kpi.setUnit(normalizeOptionalText(dto.getUnit()));
            kpi.setActual(dto.getActual());
            kpi.setWeight(dto.getWeight());
            kpi.setScore(dto.getScore());
            kpi.setWeightedScore(dto.getWeightedScore());
            kpi.setPeriod(resolvePeriodString(dto.getPeriod(), dto.getYear(), dto.getMonth(), dto.getPeriodLabel()));
            kpi.setStatus(dto.getStatus() != null ? dto.getStatus() : "SUBMITTED");
            kpi.setRecordStatus("Active");
            return kpi;
        }).collect(Collectors.toList());

        kpiRepository.saveAll(kpis);

        String metadata = null;
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            metadata = mapper.writeValueAsString(kpiDtos);
        } catch (Exception e) {
        }

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

        return updateKpisInternal(managerUserId, managerUser.getRole().getId(), employeeId, employee, kpiUpdates,
                "Manager " + manager.getEmployeeName());
    }

    @Transactional
    public List<KpiDto> updateKpiActualsByHr(Long hrUserId, Long employeeId, List<KpiDto> kpiUpdates) {
        if (kpiUpdates == null || kpiUpdates.isEmpty())
            return List.of();

        User hrUser = userRepository.findById(hrUserId)
                .orElseThrow(() -> new RuntimeException("HR user not found"));

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        return updateKpisInternal(hrUserId, hrUser.getRole().getId(), employeeId, employee, kpiUpdates,
                "HR User "
                        + (hrUser.getEmployee() != null ? hrUser.getEmployee().getEmployeeName() : hrUser.getEmail()));
    }

    @Transactional
    public List<DepartmentKpiDto> updateDepartmentKpiActualsByHr(Long hrUserId, Long departmentId,
            List<DepartmentKpiDto> updates) {
        if (updates == null || updates.isEmpty())
            return List.of();

        User hrUser = userRepository.findById(hrUserId)
                .orElseThrow(() -> new RuntimeException("HR user not found"));

        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new RuntimeException("Department not found"));

        String status = updates.get(0).getStatus();
        if (status == null || status.isBlank()) {
            status = "SUBMITTED";
        }

        List<DepartmentKpi> updatedKpis = new ArrayList<>();
        for (DepartmentKpiDto update : updates) {
            if (update.getId() == null)
                continue;

            DepartmentKpi kpi = departmentKpiRepository.findById(update.getId())
                    .orElseThrow(() -> new RuntimeException("Department KPI not found"));

            if (!kpi.getDepartment().getId().equals(departmentId)) {
                throw new IllegalArgumentException("KPI does not belong to the specified department");
            }

            kpi.setActual(update.getActual());
            if (update.getScore() != null)
                kpi.setScore(update.getScore());
            if (update.getWeightedScore() != null)
                kpi.setWeightedScore(update.getWeightedScore());
            kpi.setStatus(status);

            updatedKpis.add(kpi);
        }

        BigDecimal totalDeptScore = updatedKpis.stream()
                .map(k -> k.getWeightedScore() != null ? k.getWeightedScore() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        for (DepartmentKpi kpi : updatedKpis) {
            kpi.setTotalDepartmentScore(totalDeptScore);
        }

        departmentKpiRepository.saveAll(updatedKpis);

        auditService.record(AuditActionType.KPI_UPDATED, AuditTargetType.DEPARTMENT_KPI, departmentId, hrUserId,
                hrUser.getRole().getId(),
                "Department KPIs updated by HR for " + department.getName(),
                null);

        return updatedKpis.stream().map(this::convertToDepartmentDto).collect(Collectors.toList());
    }

    @Transactional
    public List<PositionKpiDto> updatePositionKpiActualsByHr(Long hrUserId, Long departmentId, Long positionId,
            List<PositionKpiDto> updates) {
        if (updates == null || updates.isEmpty())
            return List.of();

        User hrUser = userRepository.findById(hrUserId)
                .orElseThrow(() -> new RuntimeException("HR user not found"));

        Position position = positionRepository.findById(positionId)
                .orElseThrow(() -> new RuntimeException("Position not found"));

        String status = updates.get(0).getStatus();
        if (status == null || status.isBlank()) {
            status = "SUBMITTED";
        }

        List<PositionKpi> updatedKpis = new ArrayList<>();
        for (PositionKpiDto update : updates) {
            if (update.getId() == null)
                continue;

            PositionKpi kpi = positionKpiRepository.findById(update.getId())
                    .orElseThrow(() -> new RuntimeException("Position KPI not found"));

            if (!kpi.getPosition().getId().equals(positionId)) {
                throw new IllegalArgumentException("KPI does not belong to the specified position");
            }

            kpi.setActual(update.getActual());
            if (update.getScore() != null)
                kpi.setScore(update.getScore());
            if (update.getWeightedScore() != null)
                kpi.setWeightedScore(update.getWeightedScore());
            kpi.setStatus(status);

            updatedKpis.add(kpi);
        }

        positionKpiRepository.saveAll(updatedKpis);

        auditService.record(AuditActionType.KPI_UPDATED, AuditTargetType.POSITION_KPI, positionId, hrUserId,
                hrUser.getRole().getId(),
                "Position KPIs updated by HR for " + position.getName(),
                null);

        return updatedKpis.stream().map(this::convertToPositionDto).collect(Collectors.toList());
    }

    @Transactional
    public void performMonthlyReset(Long performerUserId) {
        // 1. Get all active KPIs
        List<EmployeeKpi> activeEmployeeKpis = kpiRepository.findByRecordStatus("Active");
        List<DepartmentKpi> activeDeptKpis = departmentKpiRepository.findByRecordStatus("Active");
        List<PositionKpi> activePosKpis = positionKpiRepository.findByRecordStatus("Active");

        // 2. Determine next period string (Current Month format e.g., "May 2026")
        java.time.LocalDate now = java.time.LocalDate.now();
        String currentMonthYear = java.time.format.DateTimeFormatter.ofPattern("MMMM yyyy").format(now);
        String nextMonthYear = java.time.format.DateTimeFormatter.ofPattern("MMMM yyyy").format(now.plusMonths(1));

        // Archive and Clone Employee KPIs
        List<EmployeeKpi> newEmployeeKpis = new ArrayList<>();
        for (EmployeeKpi oldKpi : activeEmployeeKpis) {
            oldKpi.setRecordStatus("Archived");

            EmployeeKpi newKpi = new EmployeeKpi();
            newKpi.setEmployee(oldKpi.getEmployee());
            newKpi.setName(oldKpi.getName());
            newKpi.setCategory(oldKpi.getCategory());
            newKpi.setTarget(oldKpi.getTarget());
            newKpi.setUnit(oldKpi.getUnit());
            newKpi.setWeight(oldKpi.getWeight());
            newKpi.setPeriod(nextMonthYear);
            newKpi.setActual(null);
            newKpi.setScore(BigDecimal.ZERO);
            newKpi.setWeightedScore(BigDecimal.ZERO);
            newKpi.setStatus("DRAFT");
            newKpi.setRecordStatus("Active");
            newEmployeeKpis.add(newKpi);
        }

        // Archive and Clone Dept KPIs
        List<DepartmentKpi> newDeptKpis = new ArrayList<>();
        for (DepartmentKpi oldKpi : activeDeptKpis) {
            oldKpi.setRecordStatus("Archived");

            DepartmentKpi newKpi = new DepartmentKpi();
            newKpi.setDepartment(oldKpi.getDepartment());
            newKpi.setName(oldKpi.getName());
            newKpi.setCategory(oldKpi.getCategory());
            newKpi.setTarget(oldKpi.getTarget());
            newKpi.setUnit(oldKpi.getUnit());
            newKpi.setWeight(oldKpi.getWeight());
            newKpi.setPeriod(nextMonthYear);
            newKpi.setActual(null);
            newKpi.setScore(BigDecimal.ZERO);
            newKpi.setWeightedScore(BigDecimal.ZERO);
            newKpi.setStatus("DRAFT");
            newKpi.setRecordStatus("Active");
            newDeptKpis.add(newKpi);
        }

        // Archive and Clone Pos KPIs
        List<PositionKpi> newPosKpis = new ArrayList<>();
        for (PositionKpi oldKpi : activePosKpis) {
            oldKpi.setRecordStatus("Archived");

            PositionKpi newKpi = new PositionKpi();
            newKpi.setDepartment(oldKpi.getDepartment());
            newKpi.setPosition(oldKpi.getPosition());
            newKpi.setName(oldKpi.getName());
            newKpi.setCategory(oldKpi.getCategory());
            newKpi.setTarget(oldKpi.getTarget());
            newKpi.setUnit(oldKpi.getUnit());
            newKpi.setWeight(oldKpi.getWeight());
            newKpi.setPeriod(nextMonthYear);
            newKpi.setActual(null);
            newKpi.setScore(BigDecimal.ZERO);
            newKpi.setWeightedScore(BigDecimal.ZERO);
            newKpi.setStatus("DRAFT");
            newKpi.setRecordStatus("Active");
            newPosKpis.add(newKpi);
        }

        if (!activeEmployeeKpis.isEmpty())
            kpiRepository.saveAll(activeEmployeeKpis);
        if (!newEmployeeKpis.isEmpty())
            kpiRepository.saveAll(newEmployeeKpis);
        if (!activeDeptKpis.isEmpty())
            departmentKpiRepository.saveAll(activeDeptKpis);
        if (!newDeptKpis.isEmpty())
            departmentKpiRepository.saveAll(newDeptKpis);
        if (!activePosKpis.isEmpty())
            positionKpiRepository.saveAll(activePosKpis);
        if (!newPosKpis.isEmpty())
            positionKpiRepository.saveAll(newPosKpis);

        // Audit Log
        User performer = userRepository.findById(performerUserId).orElse(null);
        auditService.record(AuditActionType.KPI_MONTHLY_RESET, AuditTargetType.EMPLOYEE_KPI, null, performerUserId,
                performer != null ? performer.getRole().getId() : null,
                "System-wide monthly KPI reset performed. Previous: " + currentMonthYear + ", Next: " + nextMonthYear,
                null);
    }

    private void validateYearMonth(Integer year, Integer month) {
        if (year == null || month == null) {
            throw new IllegalArgumentException("KPI period year and month are required.");
        }
        if (month < 1 || month > 12) {
            throw new IllegalArgumentException("KPI period month is invalid.");
        }
        java.time.YearMonth selected = java.time.YearMonth.of(year, month);
        java.time.YearMonth current = java.time.YearMonth.now();
        if (selected.isBefore(current)) {
            throw new IllegalArgumentException(
                    "KPI period cannot be in the past. Please choose the current or a future month.");
        }
    }

    private List<KpiDto> updateKpisInternal(Long performerUserId, Long performerRoleId, Long employeeId,
            Employee employee, List<KpiDto> kpiUpdates, String performerName) {
        if (kpiUpdates == null || kpiUpdates.isEmpty())
            return List.of();

        // Check if appraisal is finalized (LOCKED) for this period
        String periodName = resolvePeriodString(kpiUpdates.get(0).getPeriod(), kpiUpdates.get(0).getYear(),
                kpiUpdates.get(0).getMonth(), kpiUpdates.get(0).getPeriodLabel());
        if (periodName != null) {
            appraisalAssignmentRepository.findByEmployee_IdAndPeriod_Name(employeeId, periodName)
                    .ifPresent(appraisal -> {
                        if (appraisal.getStatus() == AppraisalStatus.LOCKED) {
                            throw new IllegalStateException("Cannot update KPIs for a finalized appraisal period.");
                        }
                    });
        }
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

            if (!isHrOrAudit(performerRoleId)) {
                if (isFuturePeriod(kpi.getPeriod())) {
                    throw new org.springframework.security.access.AccessDeniedException("Access denied: Cannot modify KPIs for a future period.");
                }
            }

            // Validation: Actual value is required for submission
            if ("SUBMITTED".equals(status) && (update.getActual() == null || update.getActual().trim().isEmpty())) {
                throw new IllegalArgumentException("Actual value is required for all KPIs when submitting");
            }

            // Validation: Score range check
            if (update.getScore() != null && update.getScore().compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Score for '" + kpi.getName() + "' cannot be negative");
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

        BigDecimal kpiTotalScore = updatedKpis.stream()
                .map(k -> k.getWeightedScore() != null ? k.getWeightedScore() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        for (EmployeeKpi kpi : updatedKpis) {
            kpi.setKpiTotalScore(kpiTotalScore);
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

        auditService.record(action, AuditTargetType.EMPLOYEE_KPI, employeeId, performerUserId, performerRoleId,
                performerName + " "
                        + (action.equals(AuditActionType.KPI_DRAFT_SAVED) ? "saved draft" : "submitted")
                        + " KPI actuals for "
                        + employee.getEmployeeName(),
                metadata);

        return kpiRepository.findByEmployee_IdAndPeriod(employeeId, periodName)
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

                    // Get status from latest allowed KPI if exists
                    String status = "PENDING";
                    List<String> allowedPeriods = kpiRepository.findDistinctPeriodsByEmployee_IdOrderByPeriodDesc(e.getId())
                            .stream()
                            .filter(p -> !isFuturePeriod(p))
                            .collect(Collectors.toList());
                    if (!allowedPeriods.isEmpty()) {
                        String latestAllowedPeriod = allowedPeriods.get(0);
                        status = kpiRepository.findByEmployee_IdAndPeriod(e.getId(), latestAllowedPeriod)
                                .stream()
                                .findFirst()
                                .map(EmployeeKpi::getStatus)
                                .orElse("PENDING");
                    }

                    map.put("status", status);
                    return map;
                }).collect(Collectors.toList());
    }

    public List<PositionKpiDto> getPositionKpis(Long departmentId, Long positionId, String period) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.epms.backend.security.UserPrincipal principal) {
            Long roleId = principal.getRoleId();
            if (!isHrOrAudit(roleId)) {
                if (isFuturePeriod(period)) {
                    throw new org.springframework.security.access.AccessDeniedException("Access denied: Managers cannot view future position KPI templates.");
                }
                Long managerEmployeeId = principal.getEmployeeDbId();
                Employee mgr = employeeRepository.findById(managerEmployeeId).orElse(null);
                if (mgr == null || mgr.getDepartment() == null || !mgr.getDepartment().getId().equals(departmentId)) {
                    throw new org.springframework.security.access.AccessDeniedException("Access denied: Managers can only view position KPI templates for their own department.");
                }
            }
        }
        return positionKpiRepository.findByDepartment_IdAndPosition_IdAndPeriod(departmentId, positionId, period)
                .stream()
                .map(this::convertToPositionDto)
                .collect(Collectors.toList());
    }

    public List<DepartmentKpiDto> getDepartmentKpis(Long departmentId, String period) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.epms.backend.security.UserPrincipal principal) {
            Long roleId = principal.getRoleId();
            if (!isHrOrAudit(roleId)) {
                if (isFuturePeriod(period)) {
                    throw new org.springframework.security.access.AccessDeniedException("Access denied: Managers cannot view future department KPIs.");
                }
                Long managerEmployeeId = principal.getEmployeeDbId();
                Employee mgr = employeeRepository.findById(managerEmployeeId).orElse(null);
                if (mgr == null || mgr.getDepartment() == null || !mgr.getDepartment().getId().equals(departmentId)) {
                    throw new org.springframework.security.access.AccessDeniedException("Access denied: Managers can only view department KPIs for their own department.");
                }
            }
        }
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
        PositionKpiDto firstDto = dtoList.get(0);
        validateYearMonth(firstDto.getYear(), firstDto.getMonth());
        String period = resolvePeriodString(firstDto.getPeriod(), firstDto.getYear(), firstDto.getMonth(),
                firstDto.getPeriodLabel());
        if (!dtoList.stream().allMatch(dto -> Objects.equals(dto.getYear(), firstDto.getYear())
                && Objects.equals(dto.getMonth(), firstDto.getMonth()))) {
            throw new IllegalArgumentException("All KPI records must use the same month and year.");
        }

        User performer = userRepository.findById(performerUserId).orElseThrow();
        Long roleId = performer.getRole() != null ? performer.getRole().getId() : null;
        if (!isHrOrAudit(roleId)) {
            if (isFuturePeriod(period)) {
                throw new org.springframework.security.access.AccessDeniedException("Access denied: Only HR can set up KPIs for future periods.");
            }
        }

        // Check if active position KPIs already exist
        List<PositionKpi> existingActive = positionKpiRepository
                .findByDepartmentIdAndPositionIdAndPeriodAndRecordStatus(deptId, posId, period, "Active");
        if (!existingActive.isEmpty()) {
            throw new IllegalStateException(
                    "KPIs are already defined for this position and period. Overwriting is not allowed.");
        }

        Department dept = departmentRepository.findById(deptId).orElseThrow();
        Position pos = positionRepository.findById(posId).orElseThrow();

        List<PositionKpi> entities = dtoList.stream().map(dto -> {
            PositionKpi entity = new PositionKpi();
            entity.setDepartment(dept);
            entity.setPosition(pos);
            entity.setName(dto.getName());
            entity.setCategory(dto.getCategory());
            entity.setTarget(dto.getTarget());
            entity.setUnit(normalizeOptionalText(dto.getUnit()));
            entity.setWeight(dto.getWeight());
            entity.setPeriod(resolvePeriodString(dto.getPeriod(), dto.getYear(), dto.getMonth(), dto.getPeriodLabel()));
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
        } catch (Exception e) {
        }

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
        DepartmentKpiDto firstDto = dtoList.get(0);
        validateYearMonth(firstDto.getYear(), firstDto.getMonth());
        String period = resolvePeriodString(firstDto.getPeriod(), firstDto.getYear(), firstDto.getMonth(),
                firstDto.getPeriodLabel());
        if (!dtoList.stream().allMatch(dto -> Objects.equals(dto.getYear(), firstDto.getYear())
                && Objects.equals(dto.getMonth(), firstDto.getMonth()))) {
            throw new IllegalArgumentException("All KPI records must use the same month and year.");
        }

        User performer = userRepository.findById(performerUserId).orElseThrow();
        Long roleId = performer.getRole() != null ? performer.getRole().getId() : null;
        if (!isHrOrAudit(roleId)) {
            if (isFuturePeriod(period)) {
                throw new org.springframework.security.access.AccessDeniedException("Access denied: Only HR can set up KPIs for future periods.");
            }
        }

        // Check if active department KPIs already exist
        List<DepartmentKpi> existingActive = departmentKpiRepository.findByDepartmentIdAndPeriodAndRecordStatus(deptId,
                period, "Active");
        if (!existingActive.isEmpty()) {
            throw new IllegalStateException(
                    "KPIs are already defined for this department and period. Overwriting is not allowed.");
        }

        Department dept = departmentRepository.findById(deptId).orElseThrow();

        List<DepartmentKpi> entities = dtoList.stream().map(dto -> {
            DepartmentKpi entity = new DepartmentKpi();
            entity.setDepartment(dept);
            entity.setName(dto.getName());
            entity.setCategory(dto.getCategory());
            entity.setTarget(dto.getTarget());
            entity.setUnit(normalizeOptionalText(dto.getUnit()));
            entity.setWeight(dto.getWeight());
            entity.setPeriod(resolvePeriodString(dto.getPeriod(), dto.getYear(), dto.getMonth(), dto.getPeriodLabel()));
            entity.setRecordStatus("Active");
            return entity;
        }).collect(Collectors.toList());

        List<DepartmentKpi> saved = departmentKpiRepository.saveAll(entities);

        String metadata = null;
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            metadata = mapper.writeValueAsString(dtoList);
        } catch (Exception e) {
        }

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
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.epms.backend.security.UserPrincipal principal) {
            Long roleId = principal.getRoleId();
            if (!isHrOrAudit(roleId) && isFuturePeriod(period)) {
                throw new org.springframework.security.access.AccessDeniedException("Access denied: Non-HR users cannot view future KPI statuses.");
            }
        }
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
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.epms.backend.security.UserPrincipal principal) {
            Long roleId = principal.getRoleId();
            if (!isHrOrAudit(roleId) && isFuturePeriod(period)) {
                throw new org.springframework.security.access.AccessDeniedException("Access denied: Non-HR users cannot view future KPI statuses.");
            }
        }
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
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.epms.backend.security.UserPrincipal principal) {
            Long roleId = principal.getRoleId();
            Long currentEmployeeId = principal.getEmployeeDbId();
            
            if (isHrOrAudit(roleId)) {
                // Full access
            } else if (roleId == 2L || roleId == 3L) { // MANAGER
                if (isFuturePeriod(period)) {
                    throw new org.springframework.security.access.AccessDeniedException("Access denied: Managers cannot view future KPI history.");
                }
                if (!Objects.equals(employeeId, currentEmployeeId)) {
                    Employee mgr = employeeRepository.findById(currentEmployeeId).orElse(null);
                    Employee target = employeeRepository.findById(employeeId).orElse(null);
                    if (mgr == null || target == null || mgr.getDepartment() == null || target.getDepartment() == null ||
                        !mgr.getDepartment().getId().equals(target.getDepartment().getId())) {
                        throw new org.springframework.security.access.AccessDeniedException("Access denied: Managers can only view KPI history of their team members.");
                    }
                }
            } else if (roleId == 4L) { // EMPLOYEE
                if (isFuturePeriod(period)) {
                    throw new org.springframework.security.access.AccessDeniedException("Access denied: Employees cannot view future KPI history.");
                }
                if (!Objects.equals(employeeId, currentEmployeeId)) {
                    throw new org.springframework.security.access.AccessDeniedException("Access denied: Employees can only view their own KPI history.");
                }
            }
        }
        List<EmployeeKpi> history = kpiRepository.findHistory(employeeId, period);
        if (auth != null && auth.getPrincipal() instanceof com.epms.backend.security.UserPrincipal principal) {
            Long roleId = principal.getRoleId();
            if (!isHrOrAudit(roleId)) {
                history = history.stream()
                        .filter(kpi -> !isFuturePeriod(kpi.getPeriod()))
                        .collect(Collectors.toList());
            }
        }
        return history.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<PositionKpiDto> getPositionKpiHistory(Long departmentId, Long positionId, String period) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.epms.backend.security.UserPrincipal principal) {
            Long roleId = principal.getRoleId();
            if (!isHrOrAudit(roleId)) {
                if (isFuturePeriod(period)) {
                    throw new org.springframework.security.access.AccessDeniedException("Access denied: Managers cannot view future position KPI templates.");
                }
                Long managerEmployeeId = principal.getEmployeeDbId();
                Employee mgr = employeeRepository.findById(managerEmployeeId).orElse(null);
                if (mgr == null || mgr.getDepartment() == null || !mgr.getDepartment().getId().equals(departmentId)) {
                    throw new org.springframework.security.access.AccessDeniedException("Access denied: Managers can only view position KPI templates for their own department.");
                }
            }
        }
        List<PositionKpi> history = positionKpiRepository.findHistory(departmentId, positionId, period);
        if (auth != null && auth.getPrincipal() instanceof com.epms.backend.security.UserPrincipal principal) {
            Long roleId = principal.getRoleId();
            if (!isHrOrAudit(roleId)) {
                history = history.stream()
                        .filter(kpi -> !isFuturePeriod(kpi.getPeriod()))
                        .collect(Collectors.toList());
            }
        }
        return history.stream()
                .map(this::convertToPositionDto)
                .collect(Collectors.toList());
    }

    public List<DepartmentKpiDto> getDepartmentKpiHistory(Long departmentId, String period) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.epms.backend.security.UserPrincipal principal) {
            Long roleId = principal.getRoleId();
            if (!isHrOrAudit(roleId)) {
                if (isFuturePeriod(period)) {
                    throw new org.springframework.security.access.AccessDeniedException("Access denied: Managers cannot view future department KPIs.");
                }
                Long managerEmployeeId = principal.getEmployeeDbId();
                Employee mgr = employeeRepository.findById(managerEmployeeId).orElse(null);
                if (mgr == null || mgr.getDepartment() == null || !mgr.getDepartment().getId().equals(departmentId)) {
                    throw new org.springframework.security.access.AccessDeniedException("Access denied: Managers can only view department KPIs for their own department.");
                }
            }
        }
        List<DepartmentKpi> history = departmentKpiRepository.findHistory(departmentId, period);
        if (auth != null && auth.getPrincipal() instanceof com.epms.backend.security.UserPrincipal principal) {
            Long roleId = principal.getRoleId();
            if (!isHrOrAudit(roleId)) {
                history = history.stream()
                        .filter(kpi -> !isFuturePeriod(kpi.getPeriod()))
                        .collect(Collectors.toList());
            }
        }
        return history.stream()
                .map(this::convertToDepartmentDto)
                .collect(Collectors.toList());
    }

    public List<com.epms.backend.dto.KpiHistorySummaryDto> getAllKpiHistorySummary(String period) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        List<com.epms.backend.dto.KpiHistorySummaryDto> list = kpiRepository.findHistorySummary(period);
        if (auth != null && auth.getPrincipal() instanceof com.epms.backend.security.UserPrincipal principal) {
            Long roleId = principal.getRoleId();
            Long currentEmployeeId = principal.getEmployeeDbId();
            if (isHrOrAudit(roleId)) {
                return list;
            }
            if (roleId == 2L || roleId == 3L) { // MANAGER
                Employee mgr = employeeRepository.findById(currentEmployeeId).orElse(null);
                String departmentName = (mgr != null && mgr.getDepartment() != null) ? mgr.getDepartment().getName() : "";
                return list.stream()
                        .filter(item -> !isFuturePeriod(item.getPeriod()))
                        .filter(item -> Objects.equals(item.getDepartmentName(), departmentName))
                        .collect(Collectors.toList());
            } else if (roleId == 4L) { // EMPLOYEE
                return list.stream()
                        .filter(item -> !isFuturePeriod(item.getPeriod()))
                        .filter(item -> Objects.equals(item.getEmployeeId(), currentEmployeeId))
                        .collect(Collectors.toList());
            }
        }
        return list;
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
        dto.setKpiTotalScore(kpi.getKpiTotalScore());
        dto.setPeriod(kpi.getPeriod());
        populatePeriodParts(kpi.getPeriod(), dto);
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
        dto.setActual(entity.getActual());
        dto.setWeight(entity.getWeight());
        dto.setScore(entity.getScore());
        dto.setWeightedScore(entity.getWeightedScore());
        dto.setPeriod(entity.getPeriod());
        populatePeriodParts(entity.getPeriod(), dto);
        dto.setStatus(entity.getStatus());
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
        dto.setActual(entity.getActual());
        dto.setWeight(entity.getWeight());
        dto.setScore(entity.getScore());
        dto.setWeightedScore(entity.getWeightedScore());
        dto.setTotalDepartmentScore(entity.getTotalDepartmentScore());
        dto.setPeriod(entity.getPeriod());
        populatePeriodParts(entity.getPeriod(), dto);
        dto.setStatus(entity.getStatus());
        dto.setRecordStatus(entity.getRecordStatus());
        dto.setCreatedDate(entity.getCreatedDate());
        dto.setUpdatedDate(entity.getUpdatedDate());
        return dto;
    }

    private String resolvePeriodString(String period, Integer year, Integer month, String periodLabel) {
        if (periodLabel != null && !periodLabel.isBlank()) {
            return periodLabel;
        }
        if (period != null && !period.isBlank()) {
            return period;
        }
        if (year != null && month != null) {
            try {
                return java.time.YearMonth.of(year, month)
                        .format(java.time.format.DateTimeFormatter.ofPattern("MMMM yyyy", java.util.Locale.ENGLISH));
            } catch (Exception e) {
                return periodLabel;
            }
        }
        return period != null ? period : periodLabel;
    }

    private String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private void populatePeriodParts(String period, KpiDto dto) {
        dto.setPeriodLabel(period);
        if (period == null || period.isBlank())
            return;
        dto.setYear(null);
        dto.setMonth(null);
        try {
            if (period.matches("\\d{4}-\\d{2}")) {
                java.time.YearMonth ym = java.time.YearMonth.parse(period);
                dto.setYear(ym.getYear());
                dto.setMonth(ym.getMonthValue());
            } else {
                java.time.LocalDate date = java.time.LocalDate.parse(period,
                        java.time.format.DateTimeFormatter.ofPattern("MMMM yyyy", java.util.Locale.ENGLISH));
                dto.setYear(date.getYear());
                dto.setMonth(date.getMonthValue());
            }
        } catch (Exception ignored) {
        }
    }

    private void populatePeriodParts(String period, PositionKpiDto dto) {
        dto.setPeriodLabel(period);
        if (period == null || period.isBlank())
            return;
        dto.setYear(null);
        dto.setMonth(null);
        try {
            if (period.matches("\\d{4}-\\d{2}")) {
                java.time.YearMonth ym = java.time.YearMonth.parse(period);
                dto.setYear(ym.getYear());
                dto.setMonth(ym.getMonthValue());
            } else {
                java.time.LocalDate date = java.time.LocalDate.parse(period,
                        java.time.format.DateTimeFormatter.ofPattern("MMMM yyyy", java.util.Locale.ENGLISH));
                dto.setYear(date.getYear());
                dto.setMonth(date.getMonthValue());
            }
        } catch (Exception ignored) {
        }
    }

    private void populatePeriodParts(String period, DepartmentKpiDto dto) {
        dto.setPeriodLabel(period);
        if (period == null || period.isBlank())
            return;
        dto.setYear(null);
        dto.setMonth(null);
        try {
            if (period.matches("\\d{4}-\\d{2}")) {
                java.time.YearMonth ym = java.time.YearMonth.parse(period);
                dto.setYear(ym.getYear());
                dto.setMonth(ym.getMonthValue());
            } else {
                java.time.LocalDate date = java.time.LocalDate.parse(period,
                        java.time.format.DateTimeFormatter.ofPattern("MMMM yyyy", java.util.Locale.ENGLISH));
                dto.setYear(date.getYear());
                dto.setMonth(date.getMonthValue());
            }
        } catch (Exception ignored) {
        }
    }

    public List<com.epms.backend.dto.DepartmentDto> getDepartment(String period) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.epms.backend.security.UserPrincipal principal) {
            Long roleId = principal.getRoleId();
            if (!isHrOrAudit(roleId)) {
                if (isFuturePeriod(period)) {
                    throw new org.springframework.security.access.AccessDeniedException("Access denied: Managers cannot view future department comparison.");
                }
            }
        }

        List<Department> departments = departmentRepository.findAll();
        List<com.epms.backend.dto.DepartmentDto> comparisonList = new ArrayList<>();

        List<String> futurePeriods = new ArrayList<>();
        List<String> allPeriods = jdbcTemplate.queryForList("SELECT DISTINCT period FROM employeekpis", String.class);
        for (String p : allPeriods) {
            if (isFuturePeriod(p)) {
                futurePeriods.add(p);
            }
        }

        for (Department dept : departments) {
            // 1. Total Staff
            String staffSql = "SELECT COUNT(*) FROM employee WHERE department_id = ?";
            Long totalStaff = jdbcTemplate.queryForObject(staffSql, Long.class, dept.getId());

            // 2. Department Manager Name using the specified SQL query
            String managerSql = """
                    SELECT
                        e.full_name AS manager_name
                    FROM
                        department d
                    INNER JOIN
                        employee e ON d.manager_id = e.employee_id
                    WHERE
                        d.department_id = ?;
                    """;
            String managerName = "-";
            try {
                managerName = jdbcTemplate.queryForObject(managerSql, String.class, dept.getId());
            } catch (Exception e) {
                managerName = "-";
            }

            // 3. Total Score (Average performance score)
            String scoreSql = "SELECT AVG(k.kpi_total_score) " +
                    "FROM employeekpis k " +
                    "INNER JOIN employee e ON k.employee_id = e.employee_id " +
                    "WHERE e.department_id = ? AND k.record_status = 'Active' AND k.kpi_total_score IS NOT NULL";
            Object[] scoreArgs = new Object[] { dept.getId() };
            if (period != null && !period.isBlank()) {
                scoreSql += " AND k.period = ?";
                scoreArgs = new Object[] { dept.getId(), period };
            } else {
                org.springframework.security.core.Authentication auth2 = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
                if (auth2 != null && auth2.getPrincipal() instanceof com.epms.backend.security.UserPrincipal principal) {
                    Long roleId = principal.getRoleId();
                    if (!isHrOrAudit(roleId) && !futurePeriods.isEmpty()) {
                        scoreSql += " AND k.period NOT IN (" + String.join(",", futurePeriods.stream().map(p -> "'" + p + "'").toList()) + ")";
                    }
                }
            }

            BigDecimal totalScore = BigDecimal.ZERO;
            try {
                Double avgScore = jdbcTemplate.queryForObject(scoreSql, Double.class, scoreArgs);
                if (avgScore != null) {
                    totalScore = BigDecimal.valueOf(avgScore).setScale(2, java.math.RoundingMode.HALF_UP);
                }
            } catch (Exception e) {
                totalScore = BigDecimal.ZERO;
            }

            comparisonList.add(com.epms.backend.dto.DepartmentDto.builder()
                    .departmentId(dept.getId())
                    .departmentName(dept.getName())
                    .totalStaff(totalStaff != null ? totalStaff : 0L)
                    .managerName(managerName)
                    .totalScore(totalScore)
                    .build());
        }

        return comparisonList;
    }
}
