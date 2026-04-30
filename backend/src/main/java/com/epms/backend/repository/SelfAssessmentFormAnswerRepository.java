package com.epms.backend.repository;

import com.epms.backend.entity.SelfAssessmentForm;
import com.epms.backend.entity.SelfAssessmentFormAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SelfAssessmentFormAnswerRepository extends JpaRepository<SelfAssessmentFormAnswer, Long> {

    List<SelfAssessmentFormAnswer> findByFormOrderBySortOrderAsc(SelfAssessmentForm form);
}