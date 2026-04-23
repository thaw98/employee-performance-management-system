package com.epms.backend.repository;

import com.epms.backend.entity.TrainingRecord;
import com.epms.backend.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrainingRecordRepository extends JpaRepository<TrainingRecord, Long> {
    List<TrainingRecord> findByEmployee(Employee employee);
}
