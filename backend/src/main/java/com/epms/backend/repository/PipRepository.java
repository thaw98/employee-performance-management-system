package com.epms.backend.repository;

import com.epms.backend.entity.Pip;
import com.epms.backend.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;
import java.time.LocalDate;

@Repository
public interface PipRepository extends JpaRepository<Pip, Long>, JpaSpecificationExecutor<Pip> {
    @Override
    @EntityGraph(attributePaths = {
            "employee",
            "employee.department",
            "employee.position",
            "manager",
            "manager.department",
            "manager.position",
            "objectives",
            "followUpMeetings"
    })
    Optional<Pip> findById(Long id);

    List<Pip> findByEmployee(Employee employee);
    List<Pip> findByManager(Employee manager);
    List<Pip> findByEmployeeAndStatusIn(Employee employee, List<String> statuses);
    List<Pip> findByStatusInAndEndDateLessThanEqual(List<String> statuses, LocalDate endDate);
}
