package com.epms.backend.repository;

import com.epms.backend.entity.Pip;
import com.epms.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PipRepository extends JpaRepository<Pip, Long> {
    List<Pip> findByEmployee(User employee);
    List<Pip> findByManager(User manager);
    List<Pip> findByEmployeeAndStatusIn(User employee, List<String> statuses);
}
