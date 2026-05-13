package com.epms.backend.repository;

import com.epms.backend.entity.AppraisalAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AppraisalAnswerRepository extends JpaRepository<AppraisalAnswer, Long> {
}
