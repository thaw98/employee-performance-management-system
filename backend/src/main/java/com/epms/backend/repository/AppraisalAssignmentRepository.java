package com.epms.backend.repository;

import com.epms.backend.entity.AppraisalAssignment;
import com.epms.backend.entity.AppraisalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AppraisalAssignmentRepository extends JpaRepository<AppraisalAssignment, Long> {
    List<AppraisalAssignment> findByStatus(AppraisalStatus status);
    List<AppraisalAssignment> findByEmployeeId(Long employeeId);
    java.util.Optional<AppraisalAssignment> findByEmployee_IdAndPeriod_Id(Long employeeId, Long periodId);
    java.util.Optional<AppraisalAssignment> findByEmployee_IdAndPeriod_Name(Long employeeId, String periodName);
    List<AppraisalAssignment> findByEvaluator_IdAndStatus(Long evaluatorId, AppraisalStatus status);
    List<AppraisalAssignment> findByEvaluator_Id(Long evaluatorId);
}
