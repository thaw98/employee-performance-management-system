package com.epms.backend.repository;

import com.epms.backend.entity.KpiTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KpiTemplateRepository extends JpaRepository<KpiTemplate, Long> {
    List<KpiTemplate> findByType(String type);
    List<KpiTemplate> findByTypeAndDepartmentId(String type, Long departmentId);
    List<KpiTemplate> findByTypeAndDepartmentIdAndPositionId(String type, Long departmentId, Long positionId);
}
