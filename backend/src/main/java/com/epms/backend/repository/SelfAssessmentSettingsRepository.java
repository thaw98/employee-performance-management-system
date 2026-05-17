package com.epms.backend.repository;

import com.epms.backend.entity.SelfAssessmentSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SelfAssessmentSettingsRepository extends JpaRepository<SelfAssessmentSettings, Long> {
}
