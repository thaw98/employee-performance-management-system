package com.epms.backend.repository;

import com.epms.backend.entity.KpiName;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KpiNameRepository extends JpaRepository<KpiName, Long> {
    List<KpiName> findByStatusIgnoreCase(String status);
    boolean existsByNameIgnoreCase(String name);
}
