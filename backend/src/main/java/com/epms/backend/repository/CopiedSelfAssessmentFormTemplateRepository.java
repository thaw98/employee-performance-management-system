package com.epms.backend.repository;

import com.epms.backend.entity.CopiedSelfAssessmentFormTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CopiedSelfAssessmentFormTemplateRepository extends JpaRepository<CopiedSelfAssessmentFormTemplate, Long> {
    Optional<CopiedSelfAssessmentFormTemplate> findByCreatedBy(Long createdBy);
    void deleteByCreatedBy(Long createdBy);
}
