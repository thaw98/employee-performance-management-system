package com.epms.backend.repository;

import com.epms.backend.entity.EmployeeKpi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KpiRepository extends JpaRepository<EmployeeKpi, Long> {
    List<EmployeeKpi> findByEmployee_IdAndPeriod(Long employeeId, String period);

    List<EmployeeKpi> findByEmployee_EmployeeIdAndPeriod(String employeeId, String period);
}
