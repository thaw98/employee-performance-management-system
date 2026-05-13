package com.epms.backend.repository;

import com.epms.backend.entity.Feedback;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import java.time.Instant;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long>, JpaSpecificationExecutor<Feedback> {
    Page<Feedback> findByEvaluatorId(Long evaluatorId, Pageable pageable);

    Page<Feedback> findByEvaluateeId(Long evaluateeId, Pageable pageable);

    Page<Feedback> findByEvaluatorIdOrderByCreatedDateDesc(Long evaluatorId, Pageable pageable);
    
    boolean existsByEvaluatorIdAndEvaluateeIdAndCreatedDateBetween(Long evaluatorId, Long evaluateeId, Instant start, Instant end);

    long countByEvaluatorIdAndRoleAndCreatedDateBetween(Long evaluatorId, String role, Instant start, Instant end);
}
