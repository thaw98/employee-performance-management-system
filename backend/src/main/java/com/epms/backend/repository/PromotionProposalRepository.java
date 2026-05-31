package com.epms.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.epms.backend.entity.PromotionProposal;
import com.epms.backend.entity.PromotionProposalStatus;

public interface PromotionProposalRepository extends JpaRepository<PromotionProposal, Long> {

    List<PromotionProposal> findByDepartmentIdAndStatus(Long departmentId, PromotionProposalStatus status);

    List<PromotionProposal> findByDepartmentId(Long departmentId);

    @Query("SELECT p FROM PromotionProposal p " +
           "JOIN FETCH p.employee e " +
           "JOIN FETCH p.targetPosition " +
           "JOIN FETCH p.requester " +
           "JOIN FETCH p.department " +
           "WHERE p.department.id = :departmentId")
    List<PromotionProposal> findByDepartmentIdWithDetails(@Param("departmentId") Long departmentId);

    @Query("SELECT p FROM PromotionProposal p " +
           "JOIN FETCH p.employee e " +
           "JOIN FETCH p.targetPosition " +
           "JOIN FETCH p.requester " +
           "JOIN FETCH p.department")
    List<PromotionProposal> findAllWithDetails();
    @Query("SELECT p FROM PromotionProposal p " +
           "JOIN FETCH p.employee e " +
           "JOIN FETCH p.targetPosition " +
           "JOIN FETCH p.requester " +
           "JOIN FETCH p.department " +
           "WHERE p.employee.id = :employeeId AND p.status = 'APPROVED' " +
           "ORDER BY p.updatedAt DESC")
    List<PromotionProposal> findLatestApprovedByEmployee(@Param("employeeId") Long employeeId);
}
