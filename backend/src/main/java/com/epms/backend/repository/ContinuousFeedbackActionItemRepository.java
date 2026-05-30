package com.epms.backend.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.epms.backend.entity.ContinuousFeedbackActionItem;
import com.epms.backend.entity.ContinuousFeedbackActionItemStatus;

public interface ContinuousFeedbackActionItemRepository extends JpaRepository<ContinuousFeedbackActionItem, Long> {

    List<ContinuousFeedbackActionItem> findByFeedbackIdOrderByCreatedAtDesc(Long feedbackId);

    @Query("SELECT ai FROM ContinuousFeedbackActionItem ai WHERE ai.feedback.employee.id = :employeeId ORDER BY ai.createdAt DESC")
    List<ContinuousFeedbackActionItem> findByEmployeeId(@Param("employeeId") Long employeeId);

    @Query("SELECT ai FROM ContinuousFeedbackActionItem ai WHERE ai.status IN ('OPEN', 'IN_PROGRESS') ORDER BY ai.createdAt DESC")
    List<ContinuousFeedbackActionItem> findAllOpenActionItems();

    @Query("SELECT ai FROM ContinuousFeedbackActionItem ai WHERE ai.status IN ('OPEN', 'IN_PROGRESS') "
            + "AND ai.dueDate IS NOT NULL AND ai.dueDate < :today ORDER BY ai.dueDate ASC")
    List<ContinuousFeedbackActionItem> findOverdueActionItems(@Param("today") LocalDate today);

    @Query("SELECT COUNT(ai) FROM ContinuousFeedbackActionItem ai WHERE ai.status IN ('OPEN', 'IN_PROGRESS')")
    long countOpenActionItems();

    @Query("SELECT COUNT(ai) FROM ContinuousFeedbackActionItem ai WHERE ai.status IN ('OPEN', 'IN_PROGRESS') "
            + "AND ai.dueDate IS NOT NULL AND ai.dueDate < :today")
    long countOverdueActionItems(@Param("today") LocalDate today);

    @Query("SELECT ai FROM ContinuousFeedbackActionItem ai "
            + "WHERE ai.feedback.manager.id = :managerId AND ai.status IN ('OPEN', 'IN_PROGRESS') "
            + "ORDER BY ai.createdAt DESC")
    List<ContinuousFeedbackActionItem> findOpenByManagerId(@Param("managerId") Long managerId);

    @Query("SELECT ai FROM ContinuousFeedbackActionItem ai "
            + "WHERE ai.feedback.employee.id = :employeeId AND ai.status IN ('OPEN', 'IN_PROGRESS') "
            + "ORDER BY ai.dueDate ASC")
    List<ContinuousFeedbackActionItem> findOpenByEmployeeId(@Param("employeeId") Long employeeId);
}
