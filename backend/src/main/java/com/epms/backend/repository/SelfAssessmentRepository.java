package com.epms.backend.repository;

import com.epms.backend.entity.SelfAssessment;
import com.epms.backend.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SelfAssessmentRepository extends JpaRepository<SelfAssessment, Long> {
    List<SelfAssessment> findByEmployee(Employee employee);
    Optional<SelfAssessment> findTopByEmployeeOrderByCreatedAtDesc(Employee employee);
}
