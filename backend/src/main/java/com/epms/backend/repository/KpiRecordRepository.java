package com.epms.backend.repository;

//MNA
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.epms.backend.entity.KpiRecord;
import com.epms.backend.dto.pip.EligibleEmployeeDTO;

@Repository
public interface KpiRecordRepository extends JpaRepository<KpiRecord, Long> {
    List<KpiRecord> findByEmployeeIdAndPeriodId(Long employeeId, Long periodId);

    List<KpiRecord> findByEmployeeManagerEmployeeId(Long managerId);

    @Query("SELECT new com.epms.backend.dto.pip.EligibleEmployeeDTO(r.employee.employeeId, r.employee.employeeName, r.employee.department.name, SUM(r.weightedScore)) " +
           "FROM KpiRecord r " +
           "WHERE r.employee.manager.employeeId = :managerId AND LOWER(r.period.status) = 'active' " +
           "GROUP BY r.employee.employeeId, r.employee.employeeName, r.employee.department.name " +
           "HAVING SUM(r.weightedScore) < 70")
    List<EligibleEmployeeDTO> findLowPerformersByManager(@Param("managerId") Long managerId);
}
