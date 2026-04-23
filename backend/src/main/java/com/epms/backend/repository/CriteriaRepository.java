package com.epms.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.epms.backend.entity.Criteria;

import java.util.List;

@Repository
public interface CriteriaRepository extends JpaRepository<Criteria, Long> {
    List<Criteria> findAllByOrderBySortOrderAscIdAsc();
}
