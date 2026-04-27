package com.epms.backend.repository;

import com.epms.backend.entity.PositionKpi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PositionKpiRepository extends JpaRepository<PositionKpi, Long> {
    List<PositionKpi> findByDepartment_IdAndPosition_IdAndPeriod(Long departmentId, Long positionId, String period);
}
