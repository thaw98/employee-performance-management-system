package com.epms.backend.repository;

import com.epms.backend.entity.AppraisalQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AppraisalQuestionRepository extends JpaRepository<AppraisalQuestion, Long> {
    List<AppraisalQuestion> findByCategoryIdOrderBySortOrderAsc(Long categoryId);
}
