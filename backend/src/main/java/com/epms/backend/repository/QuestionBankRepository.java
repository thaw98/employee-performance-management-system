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

    List<QuestionBank> findByIsActiveTrueOrderByCreatedOnDesc();

    List<QuestionBank> findAllByOrderByCreatedOnDesc();

    @Query("SELECT q FROM QuestionBank q WHERE LOWER(TRIM(q.questionText)) = :normalizedText")
    Optional<QuestionBank> findByNormalizedQuestionText(@Param("normalizedText") String normalizedText);
}
