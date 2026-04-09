package com.epms.backend.service;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Set;
import java.util.ArrayList;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.dto.FeedbackDetailDto;
import com.epms.backend.dto.FeedbackSessionDto;
import com.epms.backend.dto.FeedbackSubmissionDto;
import com.epms.backend.dto.FeedbackTargetDto;
import com.epms.backend.dto.FeedbackHistoryDto;
import com.epms.backend.dto.FeedbackHistoryDetailDto;
import com.epms.backend.entity.Criteria;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.Feedback;
import com.epms.backend.entity.FeedbackDetail;
import com.epms.backend.entity.User;
import com.epms.backend.entity.Position;
import com.epms.backend.dto.DepartmentPositionDto;
import com.epms.backend.repository.CriteriaRepository;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.FeedbackRepository;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.repository.PositionRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class FeedbackService {

    private final UserRepository userRepository;
    private final FeedbackRepository feedbackRepository;
    private final CriteriaRepository criteriaRepository;
    private final EmployeeRepository employeeRepository;
    private final PositionRepository positionRepository;

    @Transactional(readOnly = true)
    public FeedbackSessionDto getTargets(String currentUserIdStr) {
        Long currentUserId = Long.parseLong(currentUserIdStr);
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        log.info("Fetching feedback targets for user id: {}", currentUserId);

        List<Feedback> pastFeedbacks = feedbackRepository.findByEvaluatorId(currentUserId);
        Set<Long> alreadyEvaluatedEmployeeIds = pastFeedbacks.stream()
                .filter(f -> f.getEvaluatee() != null)
                .map(f -> f.getEvaluatee().getId())
                .collect(Collectors.toSet());

        List<User> allUsers = userRepository.findAll().stream()
                .filter(u -> !u.getId().equals(currentUser.getId()))
                .filter(User::isActive)
                .filter(u -> u.getEmployee() != null)
                .filter(u -> !alreadyEvaluatedEmployeeIds.contains(u.getEmployee().getId()))
                .collect(Collectors.toList());

        log.info("Found {} potential target users", allUsers.size());

        Collections.shuffle(allUsers);
        List<User> targetUsers = allUsers.stream().limit(5).collect(Collectors.toList());

        FeedbackSessionDto dto = new FeedbackSessionDto();
        dto.setEvaluator(mapToTargetDto(currentUser));
        dto.setTargets(targetUsers.stream().map(this::mapToTargetDto).collect(Collectors.toList()));
        return dto;
    }

    private FeedbackTargetDto mapToTargetDto(User u) {
        FeedbackTargetDto d = new FeedbackTargetDto();
        d.setId(u.getId());
        if (u.getEmployee() != null) {
            d.setEmployeeDbId(u.getEmployee().getId());
            d.setEmployeeId(u.getEmployee().getEmployeeId());
            d.setEmployeeName(u.getEmployee().getEmployeeName());
            d.setDepartmentName(u.getEmployee().getDepartment() != null ? u.getEmployee().getDepartment().getName() : "N/A");
            d.setPositionName(u.getEmployee().getPosition() != null ? u.getEmployee().getPosition().getName() : "N/A");
        } else {
            d.setEmployeeDbId(null);
            d.setEmployeeId("N/A");
            d.setEmployeeName(u.getEmail());
            d.setDepartmentName("N/A");
            d.setPositionName("N/A");
        }
        d.setRoleName(u.getRole() != null ? u.getRole().getName() : "Employee");
        return d;
    }

    @Transactional
    public void submitFeedback(String currentUserIdStr, FeedbackSubmissionDto dto) {
        Long currentUserId = Long.parseLong(currentUserIdStr);
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Position position = positionRepository.findById(dto.getEvaluateePositionId())
                .orElseThrow(() -> new RuntimeException("Role/Position not found"));

        if (currentUser.getEmployee() == null || currentUser.getEmployee().getDepartment() == null ||
            position.getDepartment() == null ||
            !currentUser.getEmployee().getDepartment().getId().equals(position.getDepartment().getId())) {
            throw new RuntimeException("Cannot evaluate a role outside of your department.");
        }

        Feedback feedback = new Feedback();
        feedback.setEvaluator(currentUser);
        feedback.setEvaluateePosition(position);
        feedback.setEvaluateeName(dto.getEvaluateeName());
        feedback.setAssessmentDate(LocalDate.now());
        feedback.setTotalPoints(dto.getTotalPoints());
        feedback.setTotalScore(dto.getTotalScore());
        feedback.setScoreGrade(dto.getScoreGrade());
        
        for (FeedbackDetailDto detailDto : dto.getDetails()) {
            FeedbackDetail detail = new FeedbackDetail();
            detail.setFeedback(feedback);
            Criteria c = criteriaRepository.findById(detailDto.getCriteriaId())
                .orElseThrow(() -> new RuntimeException("Criteria not found"));
            detail.setCriteria(c);
            detail.setRating(detailDto.getRating());
            detail.setComment(detailDto.getComment());
            feedback.getDetails().add(detail);
        }
        
        feedbackRepository.save(feedback);
    }

    @Transactional(readOnly = true)
    public List<FeedbackHistoryDto> getHistory(String currentUserIdStr) {
        Long currentUserId = Long.parseLong(currentUserIdStr);
        List<Feedback> feedbacks = feedbackRepository.findByEvaluatorId(currentUserId);
        return feedbacks.stream().map(f -> {
            FeedbackHistoryDto dto = new FeedbackHistoryDto();
            dto.setId(f.getId());
            if (f.getEvaluateeName() != null && !f.getEvaluateeName().isEmpty()) {
                dto.setEvaluateeName(f.getEvaluateeName());
                dto.setEvaluateeDepartment(f.getEvaluateePosition() != null && f.getEvaluateePosition().getDepartment() != null ? f.getEvaluateePosition().getDepartment().getName() : "N/A");
                dto.setEvaluateePosition(f.getEvaluateePosition() != null ? f.getEvaluateePosition().getName() : "N/A");
            } else if (f.getEvaluateePosition() != null) {
                dto.setEvaluateeName(f.getEvaluateePosition().getName() + " (Role)");
                dto.setEvaluateeDepartment(f.getEvaluateePosition().getDepartment() != null ? f.getEvaluateePosition().getDepartment().getName() : "N/A");
                dto.setEvaluateePosition(f.getEvaluateePosition().getName());
            } else if (f.getEvaluatee() != null) {
                dto.setEvaluateeName(f.getEvaluatee().getEmployeeName());
                dto.setEvaluateeDepartment(f.getEvaluatee().getDepartment() != null ? f.getEvaluatee().getDepartment().getName() : "N/A");
                dto.setEvaluateePosition(f.getEvaluatee().getPosition() != null ? f.getEvaluatee().getPosition().getName() : "N/A");
            } else {
                dto.setEvaluateeName("Unknown");
                dto.setEvaluateeDepartment("N/A");
                dto.setEvaluateePosition("N/A");
            }
            dto.setAssessmentDate(f.getAssessmentDate());
            dto.setTotalPoints(f.getTotalPoints());
            dto.setTotalScore(f.getTotalScore());
            dto.setScoreGrade(f.getScoreGrade());
            
            List<FeedbackHistoryDetailDto> detailDtos = f.getDetails().stream().map(d -> {
                FeedbackHistoryDetailDto ddto = new FeedbackHistoryDetailDto();
                ddto.setCriteriaName(d.getCriteria().getName());
                ddto.setRating(d.getRating());
                ddto.setComment(d.getComment());
                return ddto;
            }).collect(Collectors.toList());
            dto.setDetails(detailDtos);
            return dto;
        }).collect(Collectors.toList());
    }

    public FeedbackTargetDto mapToTargetDtoById(String userIdStr) {
        Long userId = Long.parseLong(userIdStr);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToTargetDto(user);
    }

    public List<DepartmentPositionDto> getRolesForUser(String currentUserIdStr) {
        Long currentUserId = Long.parseLong(currentUserIdStr);
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (currentUser.getEmployee() == null || currentUser.getEmployee().getDepartment() == null) {
            return Collections.emptyList();
        }

        Long deptId = currentUser.getEmployee().getDepartment().getId();
        return positionRepository.findByDepartmentIdOrderByNameAsc(deptId).stream().map(p -> {
            DepartmentPositionDto d = new DepartmentPositionDto();
            d.setId(p.getId());
            d.setName(p.getName());
            return d;
        }).collect(Collectors.toList());
    }

    public String getUserDepartmentName(String currentUserIdStr) {
        Long currentUserId = Long.parseLong(currentUserIdStr);
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (currentUser.getEmployee() != null && currentUser.getEmployee().getDepartment() != null) {
            return currentUser.getEmployee().getDepartment().getName();
        }
        return "Unknown Department";
    }
}
