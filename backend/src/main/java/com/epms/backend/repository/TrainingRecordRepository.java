package com.epms.backend.repository;

import com.epms.backend.entity.TrainingRecord;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.Pip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrainingRecordRepository extends JpaRepository<TrainingRecord, Long> {
    List<TrainingRecord> findByEmployee(Employee employee);
    List<TrainingRecord> findByEmployee_IdOrderByStartDateDescCreatedDateDesc(Long employeeId);
    Optional<TrainingRecord> findFirstByPipAndEmployeeAndTrainingName(Pip pip, Employee employee, String trainingName);
}
