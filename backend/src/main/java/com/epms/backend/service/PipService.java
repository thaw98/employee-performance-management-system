package com.epms.backend.service;

import com.epms.backend.dto.pip.*;
import com.epms.backend.entity.*;
import com.epms.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PipService {

    private final PipRepository pipRepository;
    private final PipObjectiveRepository objectiveRepository;
    private final PipProgressUpdateRepository progressUpdateRepository;
    private final FollowUpMeetingRepository meetingRepository;
    private final TrainingRecordRepository trainingRepository;
    private final EmployeeRepository employeeRepository;

    public List<EligibleEmployeeDTO> getLowPerformers(User manager) {
        if (manager.getEmployee() == null) {
            return new ArrayList<>();
        }
        return employeeRepository.findAll().stream()
                .filter(employee -> employee.getManager() != null && employee.getManager().getId().equals(manager.getEmployee().getId()))
                .map(employee -> new EligibleEmployeeDTO(
                        employee.getEmployeeId(),
                        employee.getEmployeeName(),
                        employee.getDepartment() == null ? null : employee.getDepartment().getName(),
                        null))
                .toList();
    }

    @Transactional
    public Pip createPip(PipCreateRequest request, User manager) {
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        Pip pip = new Pip();
        pip.setEmployee(employee);
        pip.setManager(manager.getEmployee());
        pip.setCreatedBy(manager.getEmployee());
        pip.setStartDate(request.getStartDate());
        pip.setEndDate(request.getEndDate());
        pip.setStatus("Active");
        pip.setOverallProgressPercentage(BigDecimal.ZERO);

        List<PipObjective> objectives = request.getObjectives().stream().map(desc -> {
            PipObjective obj = new PipObjective();
            obj.setDescription(desc);
            obj.setPip(pip);
            obj.setDueDate(request.getEndDate() != null ? request.getEndDate() : LocalDate.now());
            obj.setProgressPercentage(0);
            return obj;
        }).toList();

        pip.setObjectives(objectives);
        return pipRepository.save(pip);
    }

    public List<Pip> getManagerPips(User manager) {
        return pipRepository.findByManager(manager.getEmployee());
    }

    public List<Pip> getEmployeePips(User employee) {
        return pipRepository.findByEmployee(employee.getEmployee());
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

        if (!"Active".equalsIgnoreCase(objective.getPip().getStatus())
                && !"Reopened".equalsIgnoreCase(objective.getPip().getStatus())) {
            throw new RuntimeException("Cannot update progress on a closed PIP");
        }

        PipProgressUpdate update = new PipProgressUpdate();
        update.setPip(objective.getPip());
        update.setObjective(objective);
        update.setPreviousPercentage(objective.getProgressPercentage());
        update.setNewPercentage(request.getProgressPercentage());
        update.setFeedback(request.getFeedback());
        update.setUpdatedBy(updatedBy.getEmployee());
        update.setUpdateDate(LocalDate.now());

        objective.setProgressPercentage(request.getProgressPercentage());
        updatePipProgress(objective.getPip());

        progressUpdateRepository.save(update);
        pipRepository.save(objective.getPip());
        return objectiveRepository.save(objective);
    }

    @Transactional
    public FollowUpMeeting scheduleMeeting(Long pipId, MeetingScheduleRequest request, User actor) {
        Pip pip = getPipById(pipId);

        FollowUpMeeting meeting = new FollowUpMeeting();
        meeting.setPip(pip);
        meeting.setMeetingTime(request.getMeetingTime());
        meeting.setStatus("Scheduled");
        meeting.getMeeting().setManager(pip.getManager());
        meeting.getMeeting().setEmployee(pip.getEmployee());
        meeting.getMeeting().setCreatedBy(actor.getEmployee());
        meeting.getMeeting().setStatus("Scheduled");

        return meetingRepository.save(meeting);
    }

    @Transactional
    public Pip closePip(Long pipId, PipCloseRequest request) {
        Pip pip = getPipById(pipId);
        pip.setStatus("Closed");
        pip.setActualEndDate(LocalDate.now());
        pip.setClosingRemarks(request.getClosingRemarks());
        return pipRepository.save(pip);
    }

    @Transactional
    public Pip reopenPip(Long pipId, PipReopenRequest request) {
        Pip pip = getPipById(pipId);
        pip.setStatus("Reopened");
        pip.setReopenReason(request.getReason());
        return pipRepository.save(pip);
    }

    @Transactional
    public Pip reviewPip(Long pipId, PipReviewRequest request) {
        Pip pip = getPipById(pipId);
        if ("CONFIRMED".equals(request.getAction())) {
            pip.setStatus("Active");
        } else if ("DENIED".equals(request.getAction())) {
            pip.setStatus("Closed");
        }
        return pipRepository.save(pip);
    }

    public List<TrainingRecord> getEmployeeTrainingHistory(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        return trainingRepository.findByEmployee(employee);
    }

    public List<PipProgressUpdate> getObjectiveHistory(Long objectiveId) {
        PipObjective objective = objectiveRepository.findById(objectiveId)
                .orElseThrow(() -> new RuntimeException("Objective not found"));
        return progressUpdateRepository.findByObjective(objective);
    }

    private void updatePipProgress(Pip pip) {
        List<PipObjective> objectives = pip.getObjectives();
        if (objectives == null || objectives.isEmpty()) {
            pip.setOverallProgressPercentage(BigDecimal.ZERO);
            return;
        }
        double average = objectives.stream()
                .mapToInt(PipObjective::getProgressPercentage)
                .average()
                .orElse(0.0);
        pip.setOverallProgressPercentage(BigDecimal.valueOf(average).setScale(2, RoundingMode.HALF_UP));
    }
}
