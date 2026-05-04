package com.epms.backend.repository;

import com.epms.backend.entity.KpiCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface KpiCategoryRepository extends JpaRepository<KpiCategory, Long> {
    List<KpiCategory> findByStatusIgnoreCase(String status);
    boolean existsByNameIgnoreCase(String name);
}
