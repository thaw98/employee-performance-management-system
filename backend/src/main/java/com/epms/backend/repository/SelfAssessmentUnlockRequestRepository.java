package com.epms.backend.repository;

import com.epms.backend.entity.SelfAssessmentForm;
import com.epms.backend.entity.SelfAssessmentUnlockRequest;
import com.epms.backend.entity.SelfAssessmentUnlockRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SelfAssessmentUnlockRequestRepository extends JpaRepository<SelfAssessmentUnlockRequest, Long> {
    boolean existsByFormAndStatus(SelfAssessmentForm form, SelfAssessmentUnlockRequestStatus status);

    Optional<SelfAssessmentUnlockRequest> findFirstByFormAndStatusOrderByRequestedAtDesc(
            SelfAssessmentForm form,
            SelfAssessmentUnlockRequestStatus status);

    List<SelfAssessmentUnlockRequest> findAllByOrderByRequestedAtDesc();
}
