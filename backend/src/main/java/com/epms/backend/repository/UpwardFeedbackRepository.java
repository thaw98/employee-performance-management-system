package com.epms.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.epms.backend.entity.UpwardFeedback;
import com.epms.backend.entity.UpwardFeedbackStatus;

public interface UpwardFeedbackRepository extends JpaRepository<UpwardFeedback, Long> {

    List<UpwardFeedback> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);

    List<UpwardFeedback> findByManagerIdOrderByCreatedAtDesc(Long managerId);

    List<UpwardFeedback> findByEmployeeIdAndStatusOrderByCreatedAtDesc(Long employeeId, UpwardFeedbackStatus status);

    List<UpwardFeedback> findByManagerIdAndStatusOrderByCreatedAtDesc(Long managerId, UpwardFeedbackStatus status);

    List<UpwardFeedback> findByEmployeeIdOrManagerIdOrderByCreatedAtDesc(Long employeeId, Long managerId);

    List<UpwardFeedback> findAllByOrderByCreatedAtDesc();
}
