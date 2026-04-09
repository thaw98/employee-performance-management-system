package com.epms.backend.service;

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

    public SelfAssessmentService(SelfAssessmentRepository selfAssessmentRepository,
                                 com.epms.backend.repository.EmployeeRepository employeeRepository) {
        this.selfAssessmentRepository = selfAssessmentRepository;
        this.employeeRepository = employeeRepository;
    }

    public List<SelfAssessment> getAllSelfAssessments() {
        return selfAssessmentRepository.findAll();
    }

    public List<SelfAssessment> getEmployeeSelfAssessments(Employee employee) {
        return selfAssessmentRepository.findByEmployee(employee);
    }

    public SelfAssessment getLatestSelfAssessment(Employee employee) {
        return selfAssessmentRepository.findTopByEmployeeOrderByCreatedAtDesc(employee).orElse(null);
    }

    @Transactional
    public void createForAllEmployees() {
        List<Employee> allEmployees = employeeRepository.findAll();
        for (Employee emp : allEmployees) {
            // Optional: Skip if already assigned an active one?
            // For now, allow multiple as per "add more self-assignments" requirement.
            createAssignment(emp);
        }
    }

    @Transactional
    public SelfAssessment createAssignment(Employee employee) {
        SelfAssessment sa = new SelfAssessment();
        sa.setEmployee(employee);
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

        sa.setEmployee(existing.getEmployee());
        validateRatings(sa.getItems());
        calculateScores(sa);
        existing.setItems(sa.getItems());
        existing.setEmployeeRemarks(sa.getEmployeeRemarks());
        existing.setEmployeeSignature(sa.getEmployeeSignature());
        existing.setStatus(SelfAssessmentStatus.LOCKED);
        existing.setEmployeeSignedAt(LocalDateTime.now());

        if (existing.getItems() != null) {
            existing.getItems().forEach(item -> item.setSelfAssessment(existing));
        }

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
        double score = ((double) totalPoints / (numQuestions * 5)) * 100;

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
}
