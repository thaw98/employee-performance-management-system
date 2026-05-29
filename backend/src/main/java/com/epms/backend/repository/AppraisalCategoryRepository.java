package com.epms.backend.repository;

import java.util.Optional;

import com.epms.backend.entity.AppraisalCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AppraisalCategoryRepository extends JpaRepository<AppraisalCategory, Long> {
    boolean existsByName(String name);
    boolean existsByNameAndIdNot(String name, Long id);
    java.util.List<AppraisalCategory> findAllByOrderBySortOrderAsc();
    Optional<AppraisalCategory> findByNameIgnoreCase(String name);
}
