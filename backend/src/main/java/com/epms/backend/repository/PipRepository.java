package com.epms.backend.repository;

import com.epms.backend.entity.Pip;
import com.epms.backend.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PipRepository extends JpaRepository<Pip, Long> {
    List<Pip> findByEmployee(Employee employee);
    List<Pip> findByManager(Employee manager);
    List<Pip> findByEmployeeAndStatusIn(Employee employee, List<String> statuses);
}
