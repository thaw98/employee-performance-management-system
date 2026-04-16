package com.epms.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.epms.backend.entity.Feedback;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    java.util.List<Feedback> findByEvaluator_Id(Long evaluatorId);
}
