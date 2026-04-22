package com.epms.backend.service;

import com.epms.backend.entity.AppraisalAssignment;
import com.epms.backend.entity.AppraisalStatus;
import com.epms.backend.repository.AppraisalAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AppraisalAssignmentService {

    private final AppraisalAssignmentRepository appraisalAssignmentRepository;
    private final AuditService auditService;

    public List<AppraisalAssignment> getAllAssignments() {
        return appraisalAssignmentRepository.findAll();
    }

    public AppraisalAssignment getById(Long id) {
        return appraisalAssignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appraisal not found"));
    }

    @Transactional
    public AppraisalAssignment approve(Long id, String comments, String signature, Long userId, Long roleId) {
        AppraisalAssignment assignment = getById(id);
        assignment.setStatus(AppraisalStatus.HR_APPROVED);
        assignment.setHrComments(comments);
        assignment.setHrSignature(signature);
        assignment.setHrSignedAt(Instant.now());
        assignment.setUpdatedAt(Instant.now());

        AppraisalAssignment saved = appraisalAssignmentRepository.save(assignment);
        
        auditService.record("APPROVE", "AppraisalAssignment", id, userId, roleId, 
                "HR Approved appraisal for employee ID: " + assignment.getEmployee().getId(), null);
        
        return saved;
    }

    @Transactional
    public AppraisalAssignment reject(Long id, String comments, Long userId, Long roleId) {
        AppraisalAssignment assignment = getById(id);
        assignment.setStatus(AppraisalStatus.REJECTED);
        assignment.setHrComments(comments);
        assignment.setUpdatedAt(Instant.now());

        AppraisalAssignment saved = appraisalAssignmentRepository.save(assignment);

        auditService.record("REJECT", "AppraisalAssignment", id, userId, roleId, 
                "HR Rejected appraisal for employee ID: " + assignment.getEmployee().getId(), null);

        return saved;
    }

    @Transactional
    public AppraisalAssignment returnForRevision(Long id, String comments, Long userId, Long roleId) {
        AppraisalAssignment assignment = getById(id);
        assignment.setStatus(AppraisalStatus.RETURNED);
        assignment.setHrComments(comments);
        assignment.setUpdatedAt(Instant.now());

        AppraisalAssignment saved = appraisalAssignmentRepository.save(assignment);

        auditService.record("RETURN", "AppraisalAssignment", id, userId, roleId, 
                "HR Returned appraisal for revision for employee ID: " + assignment.getEmployee().getId(), null);

        return saved;
    }

    @Transactional
    public AppraisalAssignment lock(Long id, Long userId, Long roleId) {
        AppraisalAssignment assignment = getById(id);
        assignment.setStatus(AppraisalStatus.LOCKED);
        assignment.setUpdatedAt(Instant.now());

        AppraisalAssignment saved = appraisalAssignmentRepository.save(assignment);

        auditService.record("LOCK", "AppraisalAssignment", id, userId, roleId, 
                "HR Locked appraisal for employee ID: " + assignment.getEmployee().getId(), null);

        return saved;
    }
}
