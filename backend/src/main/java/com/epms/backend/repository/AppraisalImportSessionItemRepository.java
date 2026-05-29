package com.epms.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.epms.backend.entity.AppraisalImportSessionItem;

public interface AppraisalImportSessionItemRepository extends JpaRepository<AppraisalImportSessionItem, Long> {
    List<AppraisalImportSessionItem> findBySessionIdOrderByRowNumber(Long sessionId);
    List<AppraisalImportSessionItem> findBySessionIdAndStatusOrderByRowNumber(Long sessionId, String status);
}
