package com.epms.backend.service;

import com.epms.backend.dto.pip.*;
import com.epms.backend.entity.*;
import com.epms.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PipService {

    private final PipRepository pipRepository;
    private final PipObjectiveRepository objectiveRepository;
    private final PipProgressUpdateRepository progressUpdateRepository;
    private final FollowUpMeetingRepository meetingRepository;
    private final TrainingRecordRepository trainingRepository;
    private final UserRepository userRepository;

    @Transactional
    public Pip createPip(PipCreateRequest request, User manager) {
        User employee = userRepository.findByEmployee_Id(request.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        Pip pip = new Pip();
        pip.setEmployee(employee);
        pip.setManager(manager);
        pip.setStartDate(request.getStartDate());
        pip.setEndDate(request.getEndDate());
        pip.setTotalHours(request.getTotalHours() != null ? request.getTotalHours() : 0);
        pip.setCompletedHours(0);
        pip.setStatus("ACTIVE");

        List<PipObjective> objectives = request.getObjectives().stream().map(desc -> {
            PipObjective obj = new PipObjective();
            obj.setDescription(desc);
            obj.setPip(pip);
            obj.setProgressPercentage(0);
            return obj;
        }).collect(Collectors.toList());

        pip.setObjectives(objectives);
        return pipRepository.save(pip);
    }

    public List<Pip> getManagerPips(User manager) {
        return pipRepository.findByManager(manager);
    }

    public List<Pip> getEmployeePips(User employee) {
        return pipRepository.findByEmployee(employee);
    }

    public List<Pip> getAllPips() {
        return pipRepository.findAll();
    }

    public Pip getPipById(Long id) {
        return pipRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PIP not found"));
    }

    @Transactional
    public PipObjective updateObjectiveProgress(Long objectiveId, ProgressUpdateRequest request, User updatedBy) {
        PipObjective objective = objectiveRepository.findById(objectiveId)
                .orElseThrow(() -> new RuntimeException("Objective not found"));

        if (!objective.getPip().getStatus().equals("ACTIVE")) {
            throw new RuntimeException("Cannot update progress on a closed PIP");
        }

        PipProgressUpdate update = new PipProgressUpdate();
        update.setObjective(objective);
        update.setPreviousPercentage(objective.getProgressPercentage());
        update.setNewPercentage(request.getProgressPercentage());
        update.setFeedback(request.getFeedback());
        update.setUpdatedBy(updatedBy);

        objective.setProgressPercentage(request.getProgressPercentage());

        if (request.getCompletedHours() != null) {
            Pip pip = objective.getPip();
            pip.setCompletedHours(request.getCompletedHours());
            pipRepository.save(pip);
        }

        progressUpdateRepository.save(update);
        return objectiveRepository.save(objective);
    }

    @Transactional
    public FollowUpMeeting scheduleMeeting(Long pipId, MeetingScheduleRequest request) {
        Pip pip = getPipById(pipId);

        FollowUpMeeting meeting = new FollowUpMeeting();
        meeting.setPip(pip);
        meeting.setMeetingTime(request.getMeetingTime());
        meeting.setStatus("SCHEDULED");

        return meetingRepository.save(meeting);
    }

    @Transactional
    public Pip closePip(Long pipId, PipCloseRequest request) {
        Pip pip = getPipById(pipId);
        pip.setStatus("CLOSED");
        pip.setFinalOutcome(request.getFinalOutcome());
        pip.setClosingRemarks(request.getClosingRemarks());
        return pipRepository.save(pip);
    }

    @Transactional
    public Pip reopenPip(Long pipId, PipReopenRequest request) {
        Pip pip = getPipById(pipId);
        pip.setStatus("PENDING_REOPEN");
        pip.setReopenReason(request.getReason());
        pip.setClosingRemarks(pip.getClosingRemarks() + "\n[REOPEN REQUESTED]: " + request.getReason());
        return pipRepository.save(pip);
    }

    @Transactional
    public Pip reviewPip(Long pipId, PipReviewRequest request) {
        Pip pip = getPipById(pipId);
        if ("CONFIRMED".equals(request.getAction())) {
            pip.setStatus("ACTIVE");
        } else if ("DENIED".equals(request.getAction())) {
            if ("PENDING_CREATION".equals(pip.getStatus())) {
                pip.setStatus("DENIED");
            } else if ("PENDING_REOPEN".equals(pip.getStatus())) {
                pip.setStatus("CLOSED");
            }
        }
        return pipRepository.save(pip);
    }

    public List<TrainingRecord> getEmployeeTrainingHistory(Long employeeId) {
        User employee = userRepository.findByEmployee_Id(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        return trainingRepository.findByEmployee(employee);
    }

    public List<PipProgressUpdate> getObjectiveHistory(Long objectiveId) {
        PipObjective objective = objectiveRepository.findById(objectiveId)
                .orElseThrow(() -> new RuntimeException("Objective not found"));
        return progressUpdateRepository.findByObjective(objective);
    }
}
