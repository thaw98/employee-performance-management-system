package com.epms.backend.repository;

import com.epms.backend.entity.SelfAssessment;
import com.epms.backend.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;

@Repository
public interface SelfAssessmentRepository extends JpaRepository<SelfAssessment, Long> {

    @EntityGraph(attributePaths = {"employee", "employee.department", "employee.position", "items"})
    List<SelfAssessment> findAll();

    @EntityGraph(attributePaths = {"employee", "employee.department", "employee.position", "items"})
    List<SelfAssessment> findByEmployee(Employee employee);

    @EntityGraph(attributePaths = {"employee", "employee.department", "employee.position", "items"})
    Optional<SelfAssessment> findTopByEmployeeOrderByCreatedAtDesc(Employee employee);
}
