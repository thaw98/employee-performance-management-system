package com.epms.backend.repository;

import com.epms.backend.entity.Kpi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KpiRepository extends JpaRepository<Kpi, Long> {
    List<Kpi> findByEmployee_IdAndPeriod(Long employeeId, String period);
    List<Kpi> findByEmployee_EmployeeIdAndPeriod(String employeeId, String period);
}
