package com.epms.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.epms.backend.entity.KpiRevision;
import java.util.List;

//MNA
@Repository
public interface KpiRevisionRepository extends JpaRepository<KpiRevision, Long> {
    List<KpiRevision> findByKpiRecordIdOrderByRevisedAtDesc(Long kpiRecordId);
}
