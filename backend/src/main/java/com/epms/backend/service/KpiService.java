package com.epms.backend.service;

import com.epms.backend.dto.KpiDto;
import com.epms.backend.dto.PositionKpiDto;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.EmployeeKpi;
import com.epms.backend.entity.PositionKpi;
import com.epms.backend.entity.Department;
import com.epms.backend.entity.Position;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.KpiRepository;
import com.epms.backend.repository.PositionKpiRepository;
import com.epms.backend.repository.DepartmentRepository;
import com.epms.backend.repository.PositionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class KpiService {

    private final KpiRepository kpiRepository;
    private final EmployeeRepository employeeRepository;
    private final PositionKpiRepository positionKpiRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;

    public KpiService(KpiRepository kpiRepository, 
                      EmployeeRepository employeeRepository,
                      PositionKpiRepository positionKpiRepository,
                      DepartmentRepository departmentRepository,
                      PositionRepository positionRepository) {
        this.kpiRepository = kpiRepository;
        this.employeeRepository = employeeRepository;
        this.positionKpiRepository = positionKpiRepository;
        this.departmentRepository = departmentRepository;
        this.positionRepository = positionRepository;
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

    @Transactional
    public List<KpiDto> saveKpis(List<KpiDto> kpiDtos) {
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

        // Update the master template for this position in this department
        if (employee.getDepartment() != null && employee.getPosition() != null) {
            Long deptId = employee.getDepartment().getId();
            Long posId = employee.getPosition().getId();

            // Clear existing template
            List<PositionKpi> existingTemplate = positionKpiRepository.findByDepartment_IdAndPosition_IdAndPeriod(deptId, posId, period);
            positionKpiRepository.deleteAll(existingTemplate);

            // Save new template
            List<PositionKpi> templateEntities = kpiDtos.stream().map(dto -> {
                PositionKpi t = new PositionKpi();
                t.setDepartment(employee.getDepartment());
                t.setPosition(employee.getPosition());
                t.setName(dto.getName());
                t.setCategory(dto.getCategory());
                t.setTarget(dto.getTarget());
                t.setUnit(dto.getUnit());
                t.setWeight(dto.getWeight());
                t.setPeriod(period);
                return t;
            }).collect(Collectors.toList());
            
            List<PositionKpi> savedTemplates = positionKpiRepository.saveAll(templateEntities);

            // Propagate to ALL employees in the same department and position (including current one)
            applyToEmployees(deptId, posId, period, savedTemplates);
        } else {
            // Fallback for employees without department/position (only update this specific employee)
            List<EmployeeKpi> existing = kpiRepository.findByEmployee_IdAndPeriod(employeeId, period);
            kpiRepository.deleteAll(existing);

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
                return kpi;
            }).collect(Collectors.toList());

            kpiRepository.saveAll(kpis);
        }

        return getKpisByEmployeeAndPeriod(employeeId, period);
    }

    public List<PositionKpiDto> getPositionKpis(Long departmentId, Long positionId, String period) {
        return positionKpiRepository.findByDepartment_IdAndPosition_IdAndPeriod(departmentId, positionId, period)
                .stream()
                .map(this::convertToPositionDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<PositionKpiDto> savePositionKpis(List<PositionKpiDto> dtoList) {
        if (dtoList.isEmpty()) return List.of();

        BigDecimal totalWeight = dtoList.stream()
                .map(PositionKpiDto::getWeight)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalWeight.compareTo(new BigDecimal("100")) != 0) {
            throw new IllegalArgumentException("Total weight must equal 100%");
        }

        Long deptId = dtoList.get(0).getDepartmentId();
        Long posId = dtoList.get(0).getPositionId();
        String period = dtoList.get(0).getPeriod();

        List<PositionKpi> existing = positionKpiRepository.findByDepartment_IdAndPosition_IdAndPeriod(deptId, posId, period);
        positionKpiRepository.deleteAll(existing);

        Department dept = departmentRepository.findById(deptId).orElseThrow();
        Position pos = positionRepository.findById(posId).orElseThrow();

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
            return entity;
        }).collect(Collectors.toList());

        List<PositionKpi> saved = positionKpiRepository.saveAll(entities);

        // After saving the template, apply it to all employees in this department and position
        applyToEmployees(deptId, posId, period, saved);

        return saved.stream().map(this::convertToPositionDto).collect(Collectors.toList());
    }

    private void applyToEmployees(Long deptId, Long posId, String period, List<PositionKpi> templates) {
        List<Employee> employees = employeeRepository.findByDepartment_IdAndPosition_Id(deptId, posId);
        
        for (Employee emp : employees) {
            // Delete existing KPIs for this employee and period
            List<EmployeeKpi> existing = kpiRepository.findByEmployee_IdAndPeriod(emp.getId(), period);
            kpiRepository.deleteAll(existing);

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
                return kpi;
            }).collect(Collectors.toList());

            kpiRepository.saveAll(newKpis);
        }
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
        dto.setCreatedDate(entity.getCreatedDate());
        dto.setUpdatedDate(entity.getUpdatedDate());
        return dto;
    }
}
