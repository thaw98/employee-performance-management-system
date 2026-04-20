package com.epms.backend.repository;

import com.epms.backend.entity.PositionKpiDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PositionKpiDefinitionRepository extends JpaRepository<PositionKpiDefinition, Long> {
    List<PositionKpiDefinition> findByPositionIdOrderByDisplayOrderAsc(Long positionId);
    void deleteByPositionId(Long positionId);
}
