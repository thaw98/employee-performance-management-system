package com.epms.backend.repository;

import com.epms.backend.entity.QuestionBank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionBankRepository extends JpaRepository<QuestionBank, Long> {

    @Query("""
            SELECT q FROM QuestionBank q
            LEFT JOIN FETCH q.department
            WHERE q.ownerRoleId = :ownerRoleId
              AND ((:departmentId IS NULL AND q.department IS NULL) OR q.department.id = :departmentId)
            ORDER BY q.createdOn DESC
            """)
    List<QuestionBank> findByBankScopeOrderByCreatedOnDesc(
            @Param("ownerRoleId") Long ownerRoleId,
            @Param("departmentId") Long departmentId);

    @Query("""
            SELECT q FROM QuestionBank q
            LEFT JOIN FETCH q.department
            WHERE q.isActive = true
              AND q.ownerRoleId = :ownerRoleId
              AND ((:departmentId IS NULL AND q.department IS NULL) OR q.department.id = :departmentId)
            ORDER BY q.createdOn DESC
            """)
    List<QuestionBank> findActiveByBankScopeOrderByCreatedOnDesc(
            @Param("ownerRoleId") Long ownerRoleId,
            @Param("departmentId") Long departmentId);

    @Query("""
            SELECT q FROM QuestionBank q
            LEFT JOIN FETCH q.department
            WHERE LOWER(TRIM(q.questionText)) = :normalizedText
              AND q.ownerRoleId = :ownerRoleId
              AND ((:departmentId IS NULL AND q.department IS NULL) OR q.department.id = :departmentId)
            """)
    Optional<QuestionBank> findByNormalizedQuestionTextInScope(
            @Param("normalizedText") String normalizedText,
            @Param("ownerRoleId") Long ownerRoleId,
            @Param("departmentId") Long departmentId);
}
