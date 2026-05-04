package com.epms.backend.repository;

import com.epms.backend.entity.AppraisalCycle;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AppraisalCycleRepository extends JpaRepository<AppraisalCycle, Long> {
    java.util.List<AppraisalCycle> findByStatusIgnoreCase(String status);
}
