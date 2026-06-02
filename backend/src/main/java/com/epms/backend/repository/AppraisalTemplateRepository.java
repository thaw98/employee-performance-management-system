package com.epms.backend.repository;

import com.epms.backend.entity.AppraisalTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppraisalTemplateRepository extends JpaRepository<AppraisalTemplate, Long> {
    List<AppraisalTemplate> findAllByIsActiveTrue();

    List<AppraisalTemplate> findByReviewCycleId(Long reviewCycleId);

    @Query("SELECT t FROM AppraisalTemplate t LEFT JOIN FETCH t.targetDepartmentPositions WHERE t.reviewCycleId = :reviewCycleId")
    List<AppraisalTemplate> findByReviewCycleIdWithPositions(@Param("reviewCycleId") Long reviewCycleId);
}
