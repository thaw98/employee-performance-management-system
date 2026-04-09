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

    public SelfAssessmentService(SelfAssessmentRepository selfAssessmentRepository) {
        this.selfAssessmentRepository = selfAssessmentRepository;
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
    public SelfAssessment submitSelfAssessment(SelfAssessment sa) {
        validateRatings(sa.getItems());
        calculateScores(sa);
        sa.setStatus(SelfAssessmentStatus.SUBMITTED);
        sa.setEmployeeSignedAt(LocalDateTime.now());
        sa.setAssessmentDate(LocalDateTime.now());
        
        // Ensure items back-reference
        if (sa.getItems() != null) {
            sa.getItems().forEach(item -> item.setSelfAssessment(sa));
        }
        
        return selfAssessmentRepository.save(sa);
    }

    @Transactional
    public SelfAssessment managerReview(Long id, String comments, String signature) {
        SelfAssessment sa = selfAssessmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Self Assessment not found"));
        
        sa.setManagerComments(comments);
        sa.setManagerSignature(signature);
        sa.setManagerSignedAt(LocalDateTime.now());
        sa.setStatus(SelfAssessmentStatus.MANAGER_REVIEWED);
        
        return selfAssessmentRepository.save(sa);
    }

    @Transactional
    public SelfAssessment hrReview(Long id, String comments, String signature) {
        SelfAssessment sa = selfAssessmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Self Assessment not found"));
        
        sa.setHrComments(comments);
        sa.setHrSignature(signature);
        sa.setHrSignedAt(LocalDateTime.now());
        sa.setStatus(SelfAssessmentStatus.COMPLETED);
        
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
        if (score >= 86) return "Outstanding";
        if (score >= 71) return "Good";
        if (score >= 60) return "Meets Requirements";
        if (score >= 40) return "Needs Improvement";
        return "Unsatisfactory";
    }
}
