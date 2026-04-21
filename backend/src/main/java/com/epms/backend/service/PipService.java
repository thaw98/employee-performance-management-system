package com.epms.backend.service;

import com.epms.backend.dto.pip.*;
import com.epms.backend.entity.*;
import com.epms.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class PipService {

    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_CLOSED = "CLOSED";
    private static final String STATUS_SCHEDULED = "SCHEDULED";

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
                        employee.getId(),
                        employee.getEmployeeId(),
                        employee.getEmployeeName(),
                        employee.getDepartment() == null ? null : employee.getDepartment().getName(),
                        null))
                .toList();
    }

    @Transactional
    public Pip createPip(PipCreateRequest request, User manager) {
        Employee managerEmployee = requireManagerEmployee(manager);
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        if (employee.getManager() == null || !employee.getManager().getId().equals(managerEmployee.getId())) {
            throw new RuntimeException("You can only create PIPs for employees under your supervision");
        }

        boolean hasOpenPip = pipRepository.findByEmployeeAndStatusIn(employee, List.of(STATUS_ACTIVE, "REOPENED"))
                .stream()
                .anyMatch(pip -> !STATUS_CLOSED.equalsIgnoreCase(normalizeStatus(pip.getStatus())));
        if (hasOpenPip) {
            throw new RuntimeException("An active PIP already exists for this employee");
        }

        Pip pip = new Pip();
        pip.setEmployee(employee);
        pip.setManager(managerEmployee);
        pip.setCreatedBy(managerEmployee);
        pip.setStartDate(request.getStartDate());
        pip.setEndDate(request.getEndDate());
        pip.setStatus(STATUS_ACTIVE);
        pip.setOverallProgressPercentage(BigDecimal.ZERO);
        pip.setCreatedDate(Instant.now());
        pip.setUpdatedDate(Instant.now());

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

    public Pip getPipById(Long id, User actor) {
        Pip pip = pipRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PIP not found"));
        authorizePipAccess(pip, actor);
        return pip;
    }

    @Transactional
    public PipObjective updateObjectiveProgress(Long objectiveId, ProgressUpdateRequest request, User updatedBy) {
        PipObjective objective = objectiveRepository.findById(objectiveId)
                .orElseThrow(() -> new RuntimeException("Objective not found"));
        Pip pip = objective.getPip();
        authorizeManagerAction(pip, updatedBy);

        if (!STATUS_ACTIVE.equals(normalizeStatus(pip.getStatus()))
                && !"REOPENED".equals(normalizeStatus(pip.getStatus()))) {
            throw new RuntimeException("Cannot update progress on a closed PIP");
        }

        PipProgressUpdate update = new PipProgressUpdate();
        update.setPip(pip);
        update.setObjective(objective);
        update.setPreviousPercentage(objective.getProgressPercentage());
        update.setNewPercentage(request.getProgressPercentage());
        update.setFeedback(request.getFeedback());
        update.setUpdatedBy(updatedBy.getEmployee());
        update.setUpdateDate(LocalDate.now());
        update.setCreatedDate(Instant.now());

        objective.setProgressPercentage(request.getProgressPercentage());
        pip.setUpdatedDate(Instant.now());
        updatePipProgress(pip);

        progressUpdateRepository.save(update);
        pipRepository.save(pip);
        return objectiveRepository.save(objective);
    }

    @Transactional
    public FollowUpMeeting scheduleMeeting(Long pipId, MeetingScheduleRequest request, User actor) {
        Pip pip = getPipById(pipId, actor);
        authorizeManagerAction(pip, actor);

        if (!STATUS_ACTIVE.equals(normalizeStatus(pip.getStatus()))
                && !"REOPENED".equals(normalizeStatus(pip.getStatus()))) {
            throw new RuntimeException("Meetings can only be scheduled for active PIPs");
        }

        FollowUpMeeting meeting = new FollowUpMeeting();
        meeting.setPip(pip);
        meeting.setMeetingTime(request.getMeetingTime());
        meeting.setStatus(STATUS_SCHEDULED);
        meeting.getMeeting().setManager(pip.getManager());
        meeting.getMeeting().setEmployee(pip.getEmployee());
        meeting.getMeeting().setCreatedBy(actor.getEmployee());
        meeting.getMeeting().setStatus(STATUS_SCHEDULED);
        meeting.setCreatedDate(Instant.now());
        meeting.setUpdatedDate(Instant.now());
        pip.setUpdatedDate(Instant.now());

        return meetingRepository.save(meeting);
    }

    @Transactional
    public Pip closePip(Long pipId, PipCloseRequest request, User actor) {
        Pip pip = getPipById(pipId, actor);
        if (!isHr(actor) && !isDirectManager(pip, actor)) {
            throw new RuntimeException("You are not allowed to close this PIP");
        }
        pip.setStatus(STATUS_CLOSED);
        pip.setActualEndDate(LocalDate.now());
        pip.setClosingRemarks(request.getClosingRemarks());
        pip.setFinalOutcome(request.getFinalOutcome());
        pip.setClosedBy(actor.getEmployee());
        pip.setClosedDate(Instant.now());
        pip.setUpdatedDate(Instant.now());
        return pipRepository.save(pip);
    }

    @Transactional
    public Pip reopenPip(Long pipId, PipReopenRequest request, User actor) {
        Pip pip = getPipById(pipId, actor);
        if (!isHr(actor)) {
            throw new RuntimeException("Only HR can reopen a PIP");
        }
        pip.setStatus(STATUS_ACTIVE);
        pip.setReopenReason(request.getReason());
        pip.setReopenedBy(actor.getEmployee());
        pip.setReopenedDate(Instant.now());
        pip.setUpdatedDate(Instant.now());
        return pipRepository.save(pip);
    }

    @Transactional
    public Pip reviewPip(Long pipId, PipReviewRequest request, User actor) {
        Pip pip = getPipById(pipId, actor);
        if ("CONFIRMED".equals(request.getAction())) {
            pip.setStatus(STATUS_ACTIVE);
        } else if ("DENIED".equals(request.getAction())) {
            pip.setStatus(STATUS_CLOSED);
        }
        pip.setUpdatedDate(Instant.now());
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

    private Employee requireManagerEmployee(User actor) {
        if (actor.getEmployee() == null) {
            throw new RuntimeException("The current account is not linked to an employee record");
        }
        return actor.getEmployee();
    }

    private void authorizePipAccess(Pip pip, User actor) {
        if (isHr(actor)) {
            return;
        }
        if (actor.getEmployee() == null) {
            throw new RuntimeException("The current account is not linked to an employee record");
        }
        Long actorEmployeeId = actor.getEmployee().getId();
        if (pip.getEmployee() != null && pip.getEmployee().getId().equals(actorEmployeeId)) {
            return;
        }
        if (pip.getManager() != null && pip.getManager().getId().equals(actorEmployeeId)) {
            return;
        }
        throw new RuntimeException("You are not allowed to access this PIP");
    }

    private void authorizeManagerAction(Pip pip, User actor) {
        if (!isDirectManager(pip, actor)) {
            throw new RuntimeException("Only the assigned manager can perform this action");
        }
    }

    private boolean isDirectManager(Pip pip, User actor) {
        return actor.getEmployee() != null
                && pip.getManager() != null
                && pip.getManager().getId().equals(actor.getEmployee().getId());
    }

    private boolean isHr(User actor) {
        return actor.getRole() != null && "HR".equalsIgnoreCase(actor.getRole().getRoleName());
    }

    private String normalizeStatus(String status) {
        return status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
    }
}
