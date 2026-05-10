package com.epms.backend.repository;

import com.epms.backend.entity.PipProgressUpdate;
import com.epms.backend.entity.PipObjective;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PipProgressUpdateRepository extends JpaRepository<PipProgressUpdate, Long> {
    List<PipProgressUpdate> findByObjective(PipObjective objective);
    List<PipProgressUpdate> findByPipOrderByCreatedDateDesc(com.epms.backend.entity.Pip pip);
}
