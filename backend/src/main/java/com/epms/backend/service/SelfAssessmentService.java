package com.epms.backend.service;

import com.epms.backend.StaffTypes;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.SelfAssessment;
import com.epms.backend.entity.SelfAssessmentItem;
import com.epms.backend.entity.SelfAssessmentStatus;
import com.epms.backend.repository.SelfAssessmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SelfAssessmentService {

    private final SelfAssessmentRepository selfAssessmentRepository;
    private final com.epms.backend.repository.EmployeeRepository employeeRepository;
    private final com.epms.backend.repository.UserRepository userRepository;
    private final com.epms.backend.repository.SelfAssessmentSubjectRepository subjectRepository;
    private final NotificationService notificationService;

    public SelfAssessmentService(SelfAssessmentRepository selfAssessmentRepository,
            com.epms.backend.repository.EmployeeRepository employeeRepository,
            com.epms.backend.repository.UserRepository userRepository,
            com.epms.backend.repository.SelfAssessmentSubjectRepository subjectRepository,
            NotificationService notificationService) {
        this.selfAssessmentRepository = selfAssessmentRepository;
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
        this.subjectRepository = subjectRepository;
        this.notificationService = notificationService;
    }

    public List<SelfAssessment> getAllSelfAssessments() {
        return selfAssessmentRepository.findAll().stream()
                .filter(sa -> !isProbationEmployee(sa.getEmployee()))
                .toList();
    }

    public List<SelfAssessment> getEmployeeSelfAssessments(Employee employee) {
        if (isProbationEmployee(employee)) {
            return List.of();
        }
        return selfAssessmentRepository.findByEmployee(employee);
    }

    public SelfAssessment getLatestSelfAssessment(Employee employee) {
        if (isProbationEmployee(employee)) {
            return null;
        }
        return selfAssessmentRepository.findTopByEmployeeOrderByCreatedDateDesc(employee).orElse(null);
    }

    @Transactional
    public void createForAllEmployees() {
        List<Employee> allEmployees = employeeRepository.findAll();
        for (Employee emp : allEmployees) {
            if (isProbationEmployee(emp)) {
                continue;
            }
            // Optional: Skip if already assigned an active one?
            // For now, allow multiple as per "add more self-assignments" requirement.
            createAssignment(emp);
        }
    }

    @Transactional
    public SelfAssessment createAssignment(Employee employee) {
        Employee resolvedEmployee = employeeRepository.findById(employee.getId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        if (isProbationEmployee(resolvedEmployee)) {
            throw new RuntimeException("Probation employees cannot be assigned to self-assessment");
        }
        SelfAssessment sa = new SelfAssessment();
        sa.setEmployee(resolvedEmployee);
        sa.setStatus(SelfAssessmentStatus.UNLOCKED);
        sa.setAssessmentDate(LocalDateTime.now());
        return selfAssessmentRepository.save(sa);
    }

    @Transactional
    public SelfAssessment submitSelfAssessment(SelfAssessment sa) {
        SelfAssessment existing = selfAssessmentRepository.findById(sa.getId())
                .orElseThrow(() -> new RuntimeException("Assessment not found"));

        if (existing.getStatus() != SelfAssessmentStatus.UNLOCKED) {
            throw new RuntimeException("Assessment is already submitted or finalized.");
        }

        validateRatings(sa.getItems());

        // Update basic fields
        existing.setEmployeeRemarks(sa.getEmployeeRemarks());
        existing.setEmployeeSignature(sa.getEmployeeSignature());
        existing.setStatus(SelfAssessmentStatus.LOCKED);
        existing.setEmployeeSignedAt(LocalDateTime.now());

        // Update items: clear and add to maintain orphanRemoval and relationship
        if (existing.getItems() != null) {
            existing.getItems().clear();
        }

        if (sa.getItems() != null) {
            for (SelfAssessmentItem item : sa.getItems()) {
                if (item.getSubject() != null && item.getSubject().getId() != null) {
                    item.setSubject(subjectRepository.findById(item.getSubject().getId())
                            .orElseThrow(
                                    () -> new RuntimeException("Subject not found: " + item.getSubject().getId())));
                }
                item.setSelfAssessment(existing);
                existing.getItems().add(item);
            }
        }

        // Recalculate scores based on the newly added items in the entity
        calculateScores(existing);

        return selfAssessmentRepository.save(existing);
    }

    @Transactional
    public SelfAssessment unlock(Long id) {
        SelfAssessment sa = selfAssessmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        sa.setStatus(SelfAssessmentStatus.UNLOCKED);
        return selfAssessmentRepository.save(sa);
    }

    @Transactional
    public SelfAssessment managerReview(Long id, String comments, String signature) {
        SelfAssessment sa = selfAssessmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Self Assessment not found"));

        sa.setManagerComments(comments);
        sa.setManagerSignature(signature);
        sa.setManagerSignedAt(LocalDateTime.now());
        // Stays LOCKED until HR finalizes
        sa.setStatus(SelfAssessmentStatus.LOCKED);

        // SA-7: Notify employee
        userRepository.findByEmployee_Id(sa.getEmployee().getId()).ifPresent(user -> {
            notificationService.send(user, "Manager Review Submitted",
                    "Your manager has reviewed your self-assessment. Comments: " + comments,
                    "SELF_ASSESSMENT");
        });

        return selfAssessmentRepository.save(sa);
    }

    @Transactional
    public SelfAssessment hrReview(Long id, String comments, String signature) {
        SelfAssessment sa = selfAssessmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Self Assessment not found"));

        sa.setHrComments(comments);
        sa.setHrSignature(signature);
        sa.setHrSignedAt(LocalDateTime.now());
        sa.setStatus(SelfAssessmentStatus.FINALIZED);

        return selfAssessmentRepository.save(sa);
    }

    @Transactional
    public SelfAssessment requestCorrection(Long id, String remarks) {
        SelfAssessment sa = selfAssessmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Self Assessment not found"));

        sa.setCorrectionRemarks(remarks);
        sa.setStatus(SelfAssessmentStatus.UNLOCKED); // Unlock for employee
        sa.setEmployeeSignature(null); // Clear employee signature to force re-signing
        sa.setEmployeeSignedAt(null);

        // Notify employee
        userRepository.findByEmployee_Id(sa.getEmployee().getId()).ifPresent(user -> {
            notificationService.send(user, "Correction Requested",
                    "HR has requested a correction on your self-assessment: " + remarks,
                    "SELF_ASSESSMENT");
        });

        return selfAssessmentRepository.save(sa);
    }

    private void validateRatings(List<SelfAssessmentItem> items) {
        for (SelfAssessmentItem item : items) {
            if (item.getAnswerYesNo()) {
                if (item.getRating() < 3 || item.getRating() > 5) {
                    throw new IllegalArgumentException("For 'Yes' response, rating must be 3, 4, or 5.");
                }
            } else {
                if (item.getRating() < 1 || item.getRating() > 2) {
                    throw new IllegalArgumentException("For 'No' response, rating must be 1 or 2.");
                }
            }
        }
    }

    private void calculateScores(SelfAssessment sa) {
        int totalPoints = sa.getItems().stream().mapToInt(SelfAssessmentItem::getRating).sum();
        int numQuestions = sa.getItems().size();
        double score = (numQuestions > 0) ? ((double) totalPoints / (numQuestions * 5)) * 100 : 0.0;

        sa.setTotalPoints(totalPoints);
        sa.setTotalScore(score);
        sa.setRatingCategory(getRatingCategory(score));
    }

    private String getRatingCategory(double score) {
        if (score >= 86)
            return "Outstanding";
        if (score >= 71)
            return "Good";
        if (score >= 60)
            return "Meets Requirements";
        if (score >= 40)
            return "Needs Improvement";
        return "Unsatisfactory";
    }

    private boolean isProbationEmployee(Employee employee) {
        return employee != null
                && employee.getStaffType() != null
                && employee.getStaffType().getId() == StaffTypes.PROBATION;
    }
}
