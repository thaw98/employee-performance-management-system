package com.epms.backend.repository;

import com.epms.backend.entity.SelfAssessmentSubject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SelfAssessmentSubjectRepository extends JpaRepository<SelfAssessmentSubject, Long> {
    List<SelfAssessmentSubject> findAllByIsActiveOrderByDisplayOrderAsc(Boolean isActive);
}
