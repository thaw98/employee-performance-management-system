package com.epms.backend.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.epms.backend.entity.SelfAssessmentArchiveSnapshot;

public interface SelfAssessmentArchiveSnapshotRepository extends JpaRepository<SelfAssessmentArchiveSnapshot, Long> {

    Page<SelfAssessmentArchiveSnapshot> findByOrderByArchivedAtDesc(Pageable pageable);

    @Query("SELECT s FROM SelfAssessmentArchiveSnapshot s WHERE " +
           "LOWER(s.employeeName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.templateTitle) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.rejectionReason) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.hrUserName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.cycleName) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<SelfAssessmentArchiveSnapshot> searchByKeyword(@Param("search") String search, Pageable pageable);

    List<SelfAssessmentArchiveSnapshot> findByOriginalFormIdOrderByArchivedAtDesc(Long originalFormId);
}
