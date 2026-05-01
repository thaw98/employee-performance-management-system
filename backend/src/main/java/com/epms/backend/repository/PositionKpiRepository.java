package com.epms.backend.repository;

import com.epms.backend.entity.PositionKpi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PositionKpiRepository extends JpaRepository<PositionKpi, Long> {
    @Query("SELECT k FROM PositionKpi k WHERE k.department.id = :departmentId AND k.position.id = :positionId AND k.period = :period AND k.recordStatus = 'Active'")
    List<PositionKpi> findByDepartment_IdAndPosition_IdAndPeriod(Long departmentId, Long positionId, String period);

    List<PositionKpi> findByDepartmentIdAndPositionIdAndPeriodAndRecordStatus(Long departmentId, Long positionId, String period, String recordStatus);

    @Query("SELECT DISTINCT CONCAT(p.department.id, '-', p.position.id) FROM PositionKpi p WHERE p.period = :period AND p.recordStatus = 'Active'")
    java.util.Set<String> findDistinctDeptAndPosWithActiveKpis(String period);
}
