package com.epms.backend.repository;

import com.epms.backend.entity.EmployeeKpiAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EmployeeKpiAssignmentRepository extends JpaRepository<EmployeeKpiAssignment, Long> {
    List<EmployeeKpiAssignment> findByEmployeeIdAndPeriodId(Long employeeId, Long periodId);
}
