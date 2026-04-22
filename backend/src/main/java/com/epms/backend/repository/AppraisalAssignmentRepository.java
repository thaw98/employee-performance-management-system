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
}
