package com.epms.backend.service;

import com.epms.backend.dto.KpiDto;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.Kpi;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.KpiRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class KpiService {

    private final KpiRepository kpiRepository;
    private final EmployeeRepository employeeRepository;

    public KpiService(KpiRepository kpiRepository, EmployeeRepository employeeRepository) {
        this.kpiRepository = kpiRepository;
        this.employeeRepository = employeeRepository;
    }

    public List<KpiDto> getKpisByEmployeeAndPeriod(Long employeeId, String period) {
        return kpiRepository.findByEmployee_IdAndPeriod(employeeId, period)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<KpiDto> saveKpis(List<KpiDto> kpiDtos) {
        if (kpiDtos.isEmpty()) return List.of();

        BigDecimal totalWeight = kpiDtos.stream()
                .map(KpiDto::getWeight)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalWeight.compareTo(new BigDecimal("100")) != 0) {
            throw new IllegalArgumentException("Total weight must equal 100%");
        }

        Long employeeId = kpiDtos.get(0).getEmployeeId();
        String period = kpiDtos.get(0).getPeriod();

        // Delete existing KPIs for this employee and period to replace them
        List<Kpi> existing = kpiRepository.findByEmployee_IdAndPeriod(employeeId, period);
        kpiRepository.deleteAll(existing);

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        List<Kpi> kpis = kpiDtos.stream().map(dto -> {
            Kpi kpi = new Kpi();
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

        return kpiRepository.saveAll(kpis).stream().map(this::convertToDto).collect(Collectors.toList());
    }

    private KpiDto convertToDto(Kpi kpi) {
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
        return dto;
    }
}
