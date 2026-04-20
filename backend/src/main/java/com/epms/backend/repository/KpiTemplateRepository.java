package com.epms.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.epms.backend.entity.KpiTemplate;

//MNA
@Repository
public interface KpiTemplateRepository extends JpaRepository<KpiTemplate, Long> {
}
