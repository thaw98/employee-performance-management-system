package com.epms.backend.service;

import com.epms.backend.StaffTypes;
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
        return appraisalAssignmentRepository.findAll().stream()
                .filter(assignment -> !isProbationEmployee(assignment))
                .toList();
    }

    public List<AppraisalAssignment> getAssignmentsForEvaluator(Long evaluatorId) {
        return appraisalAssignmentRepository.findByEvaluator_Id(evaluatorId);
    }

    public AppraisalAssignment getById(Long id) {
        AppraisalAssignment assignment = appraisalAssignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appraisal not found"));
        if (isProbationEmployee(assignment)) {
            throw new RuntimeException("Appraisal not found");
        }
        return assignment;
    }

    @Transactional
    public AppraisalAssignment approve(Long id, String comments, String signature, Long userId, Long roleId) {
        AppraisalAssignment assignment = getById(id);

        if (assignment.getStatus() != AppraisalStatus.SUBMITTED && assignment.getStatus() != AppraisalStatus.RETURNED) {
            throw new RuntimeException("Only submitted or returned appraisals can be approved.");
        }

        // Calculate total score if items exist
        if (assignment.getAnswers() != null && !assignment.getAnswers().isEmpty()) {
            double sum = assignment.getAnswers().stream()
                    .mapToDouble(a -> a.getRating() != null ? a.getRating() : 0.0)
                    .sum();
            assignment.setTotalScore(sum / assignment.getAnswers().size() * 20); // Normalize to 100% assuming 5-point scale

            // Basic Rating Category Logic
            if (assignment.getTotalScore() >= 90) assignment.setRatingCategory("EXCEPTIONAL");
            else if (assignment.getTotalScore() >= 75) assignment.setRatingCategory("GOOD");
            else if (assignment.getTotalScore() >= 50) assignment.setRatingCategory("AVERAGE");
            else assignment.setRatingCategory("NEEDS_IMPROVEMENT");
        }

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

        if (assignment.getStatus() == AppraisalStatus.LOCKED) {
            throw new RuntimeException("Cannot reject a locked appraisal.");
        }

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

        if (assignment.getStatus() == AppraisalStatus.LOCKED || assignment.getStatus() == AppraisalStatus.HR_APPROVED) {
            throw new RuntimeException("Cannot return an already approved or locked appraisal.");
        }

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

        if (assignment.getStatus() != AppraisalStatus.HR_APPROVED) {
            throw new RuntimeException("Only approved appraisals can be finalized.");
        }

        assignment.setStatus(AppraisalStatus.LOCKED);
        assignment.setUpdatedAt(Instant.now());

        AppraisalAssignment saved = appraisalAssignmentRepository.save(assignment);

        auditService.record("LOCK", "AppraisalAssignment", id, userId, roleId, 
                "HR Locked appraisal for employee ID: " + assignment.getEmployee().getId(), null);

        return saved;
    }

    @Transactional
    public AppraisalAssignment unlock(Long id, String comments, Long userId, Long roleId) {
        AppraisalAssignment assignment = getById(id);

        if (assignment.getStatus() != AppraisalStatus.LOCKED) {
            throw new RuntimeException("Only locked appraisals can be unlocked.");
        }

        assignment.setStatus(AppraisalStatus.HR_APPROVED);
        if (comments != null && !comments.isBlank()) {
            assignment.setHrComments(comments);
        }
        assignment.setUpdatedAt(Instant.now());

        AppraisalAssignment saved = appraisalAssignmentRepository.save(assignment);

        auditService.record("UNLOCK", "AppraisalAssignment", id, userId, roleId, 
                "HR Unlocked appraisal for employee ID: " + assignment.getEmployee().getId(), null);

        return saved;
    }

    private boolean isProbationEmployee(AppraisalAssignment assignment) {
        return assignment != null
                && assignment.getEmployee() != null
                && assignment.getEmployee().getStaffType() != null
                && assignment.getEmployee().getStaffType().getId() == StaffTypes.PROBATION;
    }
}
