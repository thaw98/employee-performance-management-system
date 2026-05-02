package com.epms.backend.repository;

import com.epms.backend.entity.SelfAssessmentFormTemplateVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SelfAssessmentFormTemplateVersionRepository extends JpaRepository<SelfAssessmentFormTemplateVersion, Long> {

    Optional<SelfAssessmentFormTemplateVersion> findTopByTemplate_IdOrderByVersionNumberDesc(Long templateId);
}
