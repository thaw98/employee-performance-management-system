package com.epms.backend.repository;

import com.epms.backend.entity.FaqSupportQuestion;
import com.epms.backend.entity.FaqSupportStatus;
import com.epms.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FaqSupportQuestionRepository extends JpaRepository<FaqSupportQuestion, Long> {
    Page<FaqSupportQuestion> findBySubmitter(User submitter, Pageable pageable);

    Page<FaqSupportQuestion> findByStatus(FaqSupportStatus status, Pageable pageable);

    Page<FaqSupportQuestion> findByPublishedTrue(Pageable pageable);
}
