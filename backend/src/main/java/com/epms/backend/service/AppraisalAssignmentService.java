package com.epms.backend.service;

import com.epms.backend.StaffTypes;
import com.epms.backend.entity.AppraisalAssignment;
import com.epms.backend.entity.AppraisalStatus;
import com.epms.backend.repository.AppraisalAssignmentRepository;
import com.epms.backend.repository.AppraisalAnswerRepository;
import com.epms.backend.repository.AppraisalQuestionRepository;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.service.NotificationService;
import com.epms.backend.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AppraisalAssignmentService {

    private final AppraisalAssignmentRepository appraisalAssignmentRepository;
    private final AppraisalAnswerRepository appraisalAnswerRepository;
    private final AppraisalQuestionRepository appraisalQuestionRepository;
    private final AuditService auditService;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final SignatureStorageService signatureStorageService;

    public List<AppraisalAssignment> getAllAssignments() {
        List<AppraisalAssignment> list = appraisalAssignmentRepository.findAll().stream()
                .filter(a -> !isProbationEmployee(a))
                .toList();
        // Force initialization of template and its categories/questions for HR review
        list.forEach(a -> {
            if (a.getTemplate() != null) {
                a.getTemplate().getCategories().forEach(c -> {
                    if (c.getQuestions() != null) c.getQuestions().size();
                });
            }
            if (a.getEmployee() != null) {
                if (a.getEmployee().getDepartment() != null) a.getEmployee().getDepartment().getName();
                if (a.getEmployee().getPosition() != null) a.getEmployee().getPosition().getName();
            }
            if (a.getPeriod() != null) a.getPeriod().getName();
            if (a.getAnswers() != null) a.getAnswers().size();
        });
        return list;
    }

    public List<AppraisalAssignment> getAssignmentsForEvaluator(Long evaluatorId) {
        List<AppraisalAssignment> list = appraisalAssignmentRepository.findByEvaluator_Id(evaluatorId).stream()
                .filter(a -> !isProbationEmployee(a))
                .toList();
        // Force initialization of employee department and position for manager dashboard
        list.forEach(a -> {
            if (a.getEmployee() != null) {
                if (a.getEmployee().getDepartment() != null) a.getEmployee().getDepartment().getName();
                if (a.getEmployee().getPosition() != null) a.getEmployee().getPosition().getName();
            }
            if (a.getPeriod() != null) a.getPeriod().getName();
        });
        return list;
    }

    public List<AppraisalAssignment> getAssignmentsForEmployee(Long employeeId) {
        List<AppraisalAssignment> list = appraisalAssignmentRepository.findByEmployeeId(employeeId).stream()
                .filter(a -> !isProbationEmployee(a))
                .toList();
        // Force initialization for employee report view
        list.forEach(a -> {
            if (a.getEmployee() != null) {
                if (a.getEmployee().getDepartment() != null) a.getEmployee().getDepartment().getName();
                if (a.getEmployee().getPosition() != null) a.getEmployee().getPosition().getName();
            }
            if (a.getPeriod() != null) a.getPeriod().getName();
            if (a.getTemplate() != null) {
                a.getTemplate().getName();
            }
            if (a.getEvaluator() != null) {
                a.getEvaluator().getEmployeeName();
            }
        });
        return list;
    }

    public AppraisalAssignment getById(Long id) {
        AppraisalAssignment assignment = appraisalAssignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appraisal not found"));
        if (isProbationEmployee(assignment)) {
            throw new RuntimeException("Appraisal not found");
        }
        return assignment;
    }

    private boolean isManagerEditable(AppraisalStatus status) {
        return status == AppraisalStatus.PENDING_MANAGER
                || status == AppraisalStatus.RETURNED
                || status == AppraisalStatus.DRAFT;
    }

    @Transactional
    public AppraisalAssignment saveDraft(Long id, com.epms.backend.dto.EvaluationRequest req) {
        AppraisalAssignment assignment = getById(id);

        if (!isManagerEditable(assignment.getStatus())) {
            throw new RuntimeException("Draft can only be saved for pending, draft, or returned appraisals.");
        }

        replaceAnswers(assignment, req);
        assignment.setStatus(AppraisalStatus.DRAFT);
        assignment.setManagerComments(req.getComments());
        if (req.getSignature() != null) {
            assignment.setManagerSignature(persistSignatureIfNeeded(req.getSignature()));
        }
        assignment.setUpdatedAt(Instant.now());
        recalculateScore(assignment);

        return appraisalAssignmentRepository.save(assignment);
    }

    @Transactional
    public AppraisalAssignment submitEvaluation(Long id, com.epms.backend.dto.EvaluationRequest req, Long userId, Long roleId) {
        AppraisalAssignment assignment = getById(id);

        if (!isManagerEditable(assignment.getStatus())) {
            throw new RuntimeException("Evaluation can only be submitted for pending, draft, or returned appraisals.");
        }

        if (req.getSignature() == null || req.getSignature().isBlank()) {
            throw new RuntimeException("Signature is required to submit evaluation.");
        }
        if (req.getAnswers() == null || req.getAnswers().isEmpty()
                || req.getAnswers().stream().anyMatch(a -> a.getRating() == null || a.getRating() <= 0)) {
            throw new RuntimeException("All ratings are required to submit evaluation.");
        }

        replaceAnswers(assignment, req);
        assignment.setStatus(AppraisalStatus.SUBMITTED);
        assignment.setManagerComments(req.getComments());
        assignment.setManagerSignature(persistSignatureIfNeeded(req.getSignature()));
        assignment.setManagerSignedAt(Instant.now());
        assignment.setSubmittedAt(Instant.now());
        assignment.setUpdatedAt(Instant.now());

        recalculateScore(assignment);

        AppraisalAssignment saved = appraisalAssignmentRepository.save(assignment);
        
        auditService.record("SUBMIT_EVALUATION", "AppraisalAssignment", id, userId, roleId, 
                "Manager submitted evaluation for employee ID: " + assignment.getEmployee().getId(), null);

        // Notify HR users
        try {
            String managerName = (assignment.getEvaluator() != null) ? assignment.getEvaluator().getEmployeeName() : "A manager";
            String employeeName = (assignment.getEmployee() != null) ? assignment.getEmployee().getEmployeeName() : "an employee";
            String title = "Appraisal Submitted";
            String message = String.format("Manager %s has submitted the performance appraisal evaluation for %s.", managerName, employeeName);
            
            userRepository.findByRole_IdAndActiveTrue(1L).forEach(hrUser -> {
                try {
                    notificationService.send(hrUser, title, message, "APPRAISAL", saved.getId());
                } catch (Exception ex) {
                    System.err.println("Failed to send submission notification to HR user ID " + hrUser.getId() + ": " + ex.getMessage());
                }
            });
        } catch (Exception e) {
            System.err.println("Failed to initiate submission notifications to HR: " + e.getMessage());
        }
        
        return saved;
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
            
            double maxRating = (assignment.getTemplate() != null && assignment.getTemplate().getMaxRating() != null) 
                    ? assignment.getTemplate().getMaxRating() 
                    : 5.0;
            
            assignment.setTotalScore((sum / (assignment.getAnswers().size() * maxRating)) * 100);

            // Basic Rating Category Logic
            if (assignment.getTotalScore() >= 90) assignment.setRatingCategory("EXCEPTIONAL");
            else if (assignment.getTotalScore() >= 75) assignment.setRatingCategory("GOOD");
            else if (assignment.getTotalScore() >= 50) assignment.setRatingCategory("AVERAGE");
            else assignment.setRatingCategory("NEEDS_IMPROVEMENT");
        }

        assignment.setStatus(AppraisalStatus.HR_APPROVED);
        assignment.setHrComments(comments);
        assignment.setHrSignature(persistSignatureIfNeeded(signature));
        assignment.setHrSignedAt(Instant.now());
        assignment.setUpdatedAt(Instant.now());

        AppraisalAssignment saved = appraisalAssignmentRepository.save(assignment);
        
        auditService.record("APPROVE", "AppraisalAssignment", id, userId, roleId, 
                "HR Approved appraisal for employee ID: " + assignment.getEmployee().getId(), null);
        
        // Notify Manager
        String empName = (assignment.getEmployee() != null) ? assignment.getEmployee().getEmployeeName() : "an employee";
        notifyEvaluator(saved, "Appraisal Approved", 
                String.format("HR has approved the appraisal evaluation for %s.", empName));
        
        // Notify Employee
        try {
            if (saved.getEmployee() != null) {
                userRepository.findByEmployee_Id(saved.getEmployee().getId()).ifPresent(employeeUser -> {
                    try {
                        String title = "Appraisal Approved by HR";
                        String message = "HR has approved your performance appraisal. You can now view it before it is finalized.";
                        notificationService.send(employeeUser, title, message, "APPRAISAL", saved.getId());
                    } catch (Exception ex) {
                        System.err.println("Failed to send notification to Employee User ID " + employeeUser.getId() + ": " + ex.getMessage());
                    }
                });
            }
        } catch (Exception e) {
            System.err.println("Failed to initiate employee notification: " + e.getMessage());
        }

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

        // Notify Manager
        String empName = (assignment.getEmployee() != null) ? assignment.getEmployee().getEmployeeName() : "an employee";
        notifyEvaluator(saved, "Appraisal Rejected", 
                String.format("HR has rejected the appraisal evaluation for %s.", empName));

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

        // Notify Manager
        String empName = (assignment.getEmployee() != null) ? assignment.getEmployee().getEmployeeName() : "an employee";
        notifyEvaluator(saved, "Appraisal Returned for Revision", 
                String.format("HR has returned the appraisal evaluation for %s for revision.", empName));

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

        // Notify Manager
        String empName = (assignment.getEmployee() != null) ? assignment.getEmployee().getEmployeeName() : "an employee";
        notifyEvaluator(saved, "Appraisal Finalized", 
                String.format("HR has finalized and locked the appraisal evaluation for %s.", empName));

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

    @Transactional
    public AppraisalAssignment reset(Long id, Long userId, Long roleId) {
        AppraisalAssignment assignment = getById(id);

        // Reset status to PENDING_MANAGER
        assignment.setStatus(AppraisalStatus.PENDING_MANAGER);
        
        // Clear all ratings/evaluation data
        if (assignment.getAnswers() != null) {
            assignment.getAnswers().clear();
        }
        assignment.setManagerComments(null);
        assignment.setManagerSignature(null);
        assignment.setManagerSignedAt(null);
        assignment.setSubmittedAt(null);
        assignment.setTotalScore(null);
        assignment.setRatingCategory(null);
        
        // Clear HR comments/signatures
        assignment.setHrComments(null);
        assignment.setHrSignature(null);
        assignment.setHrSignedAt(null);
        
        assignment.setUpdatedAt(Instant.now());

        AppraisalAssignment saved = appraisalAssignmentRepository.save(assignment);

        auditService.record("RESET", "AppraisalAssignment", id, userId, roleId, 
                "HR Reset appraisal to draft/pending for employee ID: " + assignment.getEmployee().getId(), null);

        // Notify Manager
        String empName = (assignment.getEmployee() != null) ? assignment.getEmployee().getEmployeeName() : "an employee";
        notifyEvaluator(saved, "Appraisal Reset for Re-evaluation", 
                String.format("HR has reset the appraisal evaluation for %s. Please evaluate again.", empName));

        return saved;
    }

    private void notifyEvaluator(AppraisalAssignment assignment, String title, String message) {
        try {
            if (assignment != null && assignment.getEvaluator() != null) {
                userRepository.findByEmployee_Id(assignment.getEvaluator().getId()).ifPresent(managerUser -> {
                    try {
                        notificationService.send(managerUser, title, message, "APPRAISAL", assignment.getId());
                    } catch (Exception ex) {
                        System.err.println("Failed to send manager notification to User ID " + managerUser.getId() + ": " + ex.getMessage());
                    }
                });
            }
        } catch (Exception e) {
            System.err.println("Failed to initiate manager notification: " + e.getMessage());
        }
    }

    private void replaceAnswers(AppraisalAssignment assignment, com.epms.backend.dto.EvaluationRequest req) {
        assignment.getAnswers().clear();

        if (req.getAnswers() == null) {
            return;
        }

        req.getAnswers().stream()
                .filter(Objects::nonNull)
                .forEach(answerReq -> {
                    com.epms.backend.entity.AppraisalAnswer answer = new com.epms.backend.entity.AppraisalAnswer();
                    answer.setAssignment(assignment);
                    answer.setQuestion(appraisalQuestionRepository.findById(answerReq.getQuestionId())
                            .orElseThrow(() -> new RuntimeException("Question not found: " + answerReq.getQuestionId())));
                    answer.setRating(answerReq.getRating() != null ? answerReq.getRating().intValue() : null);
                    answer.setComments(answerReq.getComments());
                    assignment.getAnswers().add(answer);
                });
    }

    private void recalculateScore(AppraisalAssignment assignment) {
        if (assignment.getAnswers() == null || assignment.getAnswers().isEmpty()) {
            assignment.setTotalScore(null);
            assignment.setRatingCategory(null);
            return;
        }

        double sum = assignment.getAnswers().stream()
                .mapToDouble(a -> a.getRating() != null ? a.getRating() : 0.0)
                .sum();

        double maxRating = (assignment.getTemplate() != null && assignment.getTemplate().getMaxRating() != null)
                ? assignment.getTemplate().getMaxRating()
                : 5.0;

        assignment.setTotalScore((sum / (assignment.getAnswers().size() * maxRating)) * 100);

        if (assignment.getTotalScore() >= 90) assignment.setRatingCategory("EXCEPTIONAL");
        else if (assignment.getTotalScore() >= 75) assignment.setRatingCategory("GOOD");
        else if (assignment.getTotalScore() >= 50) assignment.setRatingCategory("AVERAGE");
        else assignment.setRatingCategory("NEEDS_IMPROVEMENT");
    }

    private String persistSignatureIfNeeded(String signature) {
        if (signature == null || signature.isBlank()) {
            return signature;
        }
        String trimmed = signature.trim();
        if (trimmed.startsWith(SignatureStorageService.PUBLIC_PATH_PREFIX + "/")) {
            return trimmed;
        }
        if (trimmed.startsWith("data:image/png;base64,")) {
            return signatureStorageService.storeDrawnPng(trimmed);
        }
        return trimmed;
    }

    private boolean isProbationEmployee(AppraisalAssignment assignment) {
        return assignment != null
                && assignment.getEmployee() != null
                && assignment.getEmployee().getStaffType() != null
                && assignment.getEmployee().getStaffType().getId() == StaffTypes.PROBATION;
    }
}
