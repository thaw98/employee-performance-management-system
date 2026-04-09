package com.epms.backend.repository;

//MNA
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.epms.backend.entity.KpiRecord;

@Repository
public interface KpiRecordRepository extends JpaRepository<KpiRecord, Long> {
    List<KpiRecord> findByEmployeeIdAndPeriodId(Long employeeId, Long periodId);

    List<KpiRecord> findByManagerId(Long managerId);
}
