package com.epms.backend.repository;

import com.epms.backend.entity.KpiUnit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KpiUnitRepository extends JpaRepository<KpiUnit, Long> {
    List<KpiUnit> findByStatusIgnoreCase(String status);
    boolean existsByNameIgnoreCase(String name);
}
