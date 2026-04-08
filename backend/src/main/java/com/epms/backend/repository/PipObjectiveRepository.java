package com.epms.backend.repository;

import com.epms.backend.entity.PipObjective;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PipObjectiveRepository extends JpaRepository<PipObjective, Long> {
}
