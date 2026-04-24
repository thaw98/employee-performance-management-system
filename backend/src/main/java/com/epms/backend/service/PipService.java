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
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;

@Service
@RequiredArgsConstructor
public class PipService {

    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_PENDING_CREATION = "PENDING_CREATION";
    private static final String STATUS_PENDING_CLOSE = "PENDING_CLOSE";
    private static final String STATUS_PENDING_REOPEN = "PENDING_REOPEN";
    private static final String STATUS_CLOSED = "CLOSED";
    private static final String STATUS_DENIED = "DENIED";
    private static final String STATUS_SCHEDULED = "SCHEDULED";

    private final PipRepository pipRepository;
    private final PipObjectiveRepository objectiveRepository;
    private final PipProgressUpdateRepository progressUpdateRepository;
    private final FollowUpMeetingRepository meetingRepository;
    private final TrainingRecordRepository trainingRepository;
    private final EmployeeRepository employeeRepository;
    private final NotificationService notificationService;

    public List<EligibleEmployeeDTO> getLowPerformers(User manager) {
        if (manager.getEmployee() == null) {
            return new ArrayList<>();
        }
        return employeeRepository.findAll().stream()
                .filter(employee -> employee.getManager() != null
                        && employee.getManager().getId().equals(manager.getEmployee().getId()))
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
        if (request.getEmployeeId() == null) {
            throw new RuntimeException("Employee record ID is required");
        }
        if (request.getStartDate() == null || request.getEndDate() == null) {
            throw new RuntimeException("Start date and end date are required");
        }
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new RuntimeException("End date must be on or after start date");
        }
        if (request.getObjectives() == null || request.getObjectives().isEmpty()) {
            throw new RuntimeException("At least one objective is required");
        }
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        if (employee.getManager() == null || !employee.getManager().getId().equals(managerEmployee.getId())) {
            throw new RuntimeException("You can only create PIPs for employees under your supervision");
        }

        boolean hasOpenPip = pipRepository.findByEmployeeAndStatusIn(employee,
                List.of(STATUS_ACTIVE, STATUS_PENDING_CREATION, STATUS_PENDING_REOPEN))
                .stream()
                .anyMatch(pip -> !STATUS_CLOSED.equalsIgnoreCase(pip.getStatus())
                        && !STATUS_DENIED.equalsIgnoreCase(pip.getStatus()));
        if (hasOpenPip) {
            throw new RuntimeException("An active PIP already exists for this employee");
        }

        Pip pip = new Pip();
        pip.setEmployee(employee);
        pip.setManager(managerEmployee);
        pip.setCreatedBy(managerEmployee);
        pip.setStartDate(request.getStartDate());
        pip.setEndDate(request.getEndDate());
        pip.setStatus(STATUS_PENDING_CREATION);
        pip.setOverallProgressPercentage(BigDecimal.ZERO);
        pip.setTotalHours(request.getTotalHours());
        pip.setCompletedHours(0);
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

    public List<Pip> searchPips(
            Long departmentId,
            Long positionId,
            String employeeName,
            String status,
            LocalDate startDate,
            LocalDate endDate,
            User actor) {
        Specification<Pip> spec = (root, query, cb) -> {
            // Eagerly fetch nested entities to avoid LazyInitializationException and ensure
            // data is present in JSON
            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                jakarta.persistence.criteria.Fetch<Pip, Employee> employeeFetch = root.fetch("employee",
                        jakarta.persistence.criteria.JoinType.LEFT);
                employeeFetch.fetch("department", jakarta.persistence.criteria.JoinType.LEFT);
                employeeFetch.fetch("position", jakarta.persistence.criteria.JoinType.LEFT);

                jakarta.persistence.criteria.Fetch<Pip, Employee> managerFetch = root.fetch("manager",
                        jakarta.persistence.criteria.JoinType.LEFT);
                managerFetch.fetch("department", jakarta.persistence.criteria.JoinType.LEFT);
            }

            List<Predicate> predicates = new ArrayList<>();

            // Role-based visibility
            if (isHr(actor)) {
                if (departmentId != null) {
                    predicates.add(cb.equal(root.get("employee").get("department").get("id"), departmentId));
                }
            } else if (actor.getEmployee() != null && actor.getEmployee().getDepartment() != null) {
                // Manager or Employee - restricted to their own department for managers,
                // but the controller logic usually handles Manager vs Employee differently.
                // For "Monitoring", we assume Manager view of department.
                predicates.add(cb.equal(root.get("employee").get("department").get("id"),
                        actor.getEmployee().getDepartment().getId()));
            } else {
                // No department, return nothing or just their own if they are an employee
                if (actor.getEmployee() != null) {
                    predicates.add(cb.equal(root.get("employee").get("id"), actor.getEmployee().getId()));
                } else {
                    return cb.disjunction();
                }
            }

            if (positionId != null) {
                predicates.add(cb.equal(root.get("employee").get("position").get("id"), positionId));
            }

            if (employeeName != null && !employeeName.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("employee").get("employeeName")),
                        "%" + employeeName.toLowerCase() + "%"));
            }

            if (status != null && !status.isBlank()) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            // Date Range Filter: Show PIPs that overlap with the selected range
            if (startDate != null && endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("startDate"), endDate));
                predicates.add(cb.greaterThanOrEqualTo(root.get("endDate"), startDate));
            } else if (startDate != null) {
                // Show PIPs that are active on or after the start date
                predicates.add(cb.greaterThanOrEqualTo(root.get("endDate"), startDate));
            } else if (endDate != null) {
                // Show PIPs that are active on or before the end date
                predicates.add(cb.lessThanOrEqualTo(root.get("startDate"), endDate));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return pipRepository.findAll(spec);
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
        meeting.setReminderSent(false);
        meeting.getMeeting().setManager(pip.getManager());
        meeting.getMeeting().setEmployee(pip.getEmployee());
        meeting.getMeeting().setCreatedBy(actor.getEmployee());
        meeting.getMeeting().setStatus(STATUS_SCHEDULED);
        meeting.setCreatedDate(Instant.now());
        meeting.setUpdatedDate(Instant.now());
        pip.setUpdatedDate(Instant.now());

        FollowUpMeeting savedMeeting = meetingRepository.save(meeting);

        // Send notifications
        String title = "New PIP Follow-up Meeting Scheduled";
        String message = String.format("A follow-up meeting has been scheduled for %s at %s",
                request.getMeetingTime().toLocalDate(),
                request.getMeetingTime().toLocalTime());

        try {
            if (pip.getEmployee() != null && pip.getEmployee().getUserAccount() != null) {
                notificationService.send(pip.getEmployee().getUserAccount(), title, message);
            }
            if (pip.getManager() != null && pip.getManager().getUserAccount() != null) {
                notificationService.send(pip.getManager().getUserAccount(), title, message);
            }
        } catch (Exception ignored) {
            // Keep meeting creation successful even if notification delivery fails.
        }

        return savedMeeting;
    }

    @Transactional
    public Pip closePip(Long pipId, PipCloseRequest request, User actor) {
        Pip pip = getPipById(pipId, actor);
        if (!isDirectManager(pip, actor)) {
            throw new RuntimeException("Only the assigned manager can submit a close request");
        }
        if (request.getFinalOutcome() == null || request.getFinalOutcome().trim().isEmpty()) {
            throw new RuntimeException("Final outcome is required");
        }
        if (request.getClosingRemarks() == null || request.getClosingRemarks().trim().isEmpty()) {
            throw new RuntimeException("Closing remarks are required");
        }
        pip.setStatus(STATUS_PENDING_CLOSE);
        pip.setActualEndDate(null);
        pip.setClosingRemarks(request.getClosingRemarks().trim());
        pip.setFinalOutcome(request.getFinalOutcome().trim());
        pip.setReviewReason(null);
        pip.setClosedBy(null);
        pip.setClosedDate(null);
        pip.setUpdatedDate(Instant.now());
        return pipRepository.save(pip);
    }

    @Transactional
    public Pip reopenPip(Long pipId, PipReopenRequest request, User actor) {
        Pip pip = getPipById(pipId, actor);
        if (!isDirectManager(pip, actor)) {
            throw new RuntimeException("Only the assigned manager can submit a reopen request");
        }
        if (!STATUS_CLOSED.equals(normalizeStatus(pip.getStatus()))) {
            throw new RuntimeException("Only closed PIPs can be reopened");
        }
        if (request.getReason() == null || request.getReason().trim().isEmpty()) {
            throw new RuntimeException("Reopen reason is required");
        }
        pip.setStatus(STATUS_PENDING_REOPEN);
        pip.setReopenReason(request.getReason().trim());
        pip.setReviewReason(null);
        pip.setReopenedBy(null);
        pip.setReopenedDate(null);
        pip.setUpdatedDate(Instant.now());
        return pipRepository.save(pip);
    }

    @Transactional
    public Pip reviewPip(Long pipId, PipReviewRequest request, User actor) {
        Pip pip = getPipById(pipId, actor);
        String normalizedStatus = normalizeStatus(pip.getStatus());
        String action = request.getAction() == null ? "" : request.getAction().trim().toUpperCase(Locale.ROOT);
        String reason = request.getReason() == null ? null : request.getReason().trim();

        if ("DENIED".equals(action) && (reason == null || reason.isEmpty())) {
            throw new RuntimeException("Deny reason is required");
        }

        if ("CONFIRMED".equals(action) && STATUS_PENDING_CLOSE.equals(normalizedStatus)) {
            pip.setStatus(STATUS_CLOSED);
            pip.setActualEndDate(LocalDate.now());
            pip.setClosedBy(actor.getEmployee());
            pip.setClosedDate(Instant.now());
            pip.setReviewReason(null);
        } else if ("DENIED".equals(action) && STATUS_PENDING_CLOSE.equals(normalizedStatus)) {
            pip.setStatus(STATUS_ACTIVE);
            pip.setActualEndDate(null);
            pip.setClosedBy(null);
            pip.setClosedDate(null);
            pip.setReviewReason(reason);
        } else if ("CONFIRMED".equals(action) && STATUS_PENDING_REOPEN.equals(normalizedStatus)) {
            pip.setStatus(STATUS_ACTIVE);
            pip.setReopenedBy(actor.getEmployee());
            pip.setReopenedDate(Instant.now());
            pip.setReviewReason(null);
        } else if ("DENIED".equals(action) && STATUS_PENDING_REOPEN.equals(normalizedStatus)) {
            pip.setStatus(STATUS_CLOSED);
            pip.setReviewReason(reason);
        } else if ("CONFIRMED".equals(action) && STATUS_PENDING_CREATION.equals(normalizedStatus)) {
            pip.setStatus(STATUS_ACTIVE);
            pip.setReviewReason(null);
        } else if ("DENIED".equals(action) && STATUS_PENDING_CREATION.equals(normalizedStatus)) {
            pip.setStatus(STATUS_DENIED);
            pip.setReviewReason(reason);
        } else if ("CONFIRMED".equals(action)) {
            pip.setStatus(STATUS_ACTIVE);
            pip.setReviewReason(null);
        } else if ("DENIED".equals(action)) {
            pip.setStatus(STATUS_DENIED);
            pip.setReviewReason(reason);
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

        // Allowed if it's their own PIP
        if (pip.getEmployee() != null && pip.getEmployee().getId().equals(actorEmployeeId)) {
            return;
        }

        // Allowed if they are the assigned manager
        if (pip.getManager() != null && pip.getManager().getId().equals(actorEmployeeId)) {
            return;
        }

        // Allowed if they are a department/team head and the employee is in their
        // department
        String role = actor.getRole() != null ? actor.getRole().getName() : "";
        if (("DEPARTMENT_HEAD".equalsIgnoreCase(role) || "TEAM_HEAD".equalsIgnoreCase(role))
                && actor.getEmployee().getDepartment() != null
                && pip.getEmployee() != null
                && pip.getEmployee().getDepartment() != null
                && pip.getEmployee().getDepartment().getId().equals(actor.getEmployee().getDepartment().getId())) {
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
        return actor.getRole() != null && "HR".equalsIgnoreCase(actor.getRole().getName());
    }

    private String normalizeStatus(String status) {
        return status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
    }
}
