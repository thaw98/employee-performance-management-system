package com.epms.backend.repository;

import com.epms.backend.entity.AppraisalTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AppraisalTemplateRepository extends JpaRepository<AppraisalTemplate, Long> {
    java.util.List<AppraisalTemplate> findAllByIsActiveTrue();
}
