package com.epms.backend.repository;

import com.epms.backend.entity.AppraisalCycle;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppraisalCycleRepository extends JpaRepository<AppraisalCycle, Long> {
    java.util.List<AppraisalCycle> findByStatusIgnoreCase(String status);
    java.util.List<AppraisalCycle> findByName(String name);
}
