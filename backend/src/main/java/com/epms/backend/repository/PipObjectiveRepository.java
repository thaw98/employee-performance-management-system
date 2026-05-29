package com.epms.backend.repository;

import com.epms.backend.entity.PipObjective;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PipObjectiveRepository extends JpaRepository<PipObjective, Long> {
    boolean existsByPip_Employee_IdAndActiveSessionStartIsNotNull(Long employeeId);

    List<PipObjective> findByActiveSessionStartBefore(Instant cutoff);
}
