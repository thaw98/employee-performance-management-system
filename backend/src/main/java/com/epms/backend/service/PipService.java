package com.epms.backend.service;

import com.epms.backend.dto.pip.*;
import com.epms.backend.entity.*;
import com.epms.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
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
    private static final String STATUS_AUTO_CLOSED = "AUTO_CLOSED";
    private static final String STATUS_REOPEN_REQUESTED = "REOPEN_REQUESTED";
    private static final String STATUS_CLOSED = "CLOSED";
    private static final String STATUS_DENIED = "DENIED";
    private static final String STATUS_SCHEDULED = "SCHEDULED";
    private static final String DECISION_APPROVED = "APPROVED";
    private static final String DECISION_REJECTED = "REJECTED";

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
                .filter(employee -> isManagedBy(employee, manager.getEmployee().getId()))
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

        if (!isManagedBy(employee, managerEmployee.getId())) {
            throw new RuntimeException("You can only create PIPs for employees under your supervision");
        }

        boolean hasOpenPip = pipRepository.findByEmployeeAndStatusIn(employee,
                List.of(STATUS_ACTIVE, STATUS_AUTO_CLOSED, STATUS_REOPEN_REQUESTED))
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
        pip.setOriginalEndDate(request.getEndDate());
        pip.setStatus(STATUS_ACTIVE);
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
        autoCloseExpiredPips();
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
            String roleName = actor.getRole() != null ? actor.getRole().getName().trim().toUpperCase().replace(" ", "_")
                    : "";
            boolean isManager = "DEPARTMENT_HEAD".equals(roleName) || "TEAM_HEAD".equals(roleName)
                    || "MANAGER".equals(roleName);

            if (isHr(actor)) {
                if (departmentId != null) {
                    predicates.add(cb.equal(root.get("employee").get("department").get("id"), departmentId));
                }
            } else if (isManager && actor.getEmployee() != null && actor.getEmployee().getDepartment() != null) {
                // Manager - restricted to their own department
                predicates.add(cb.equal(root.get("employee").get("department").get("id"),
                        actor.getEmployee().getDepartment().getId()));
            } else if (actor.getEmployee() != null) {
                // Regular employee - only see their own PIPs
                predicates.add(cb.equal(root.get("employee").get("id"), actor.getEmployee().getId()));
            } else {
                // No access
                return cb.disjunction();
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
        autoCloseExpiredPips();
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

        // Use manual hours if provided, otherwise updatePipProgress will calculate it
        if (request.getCompletedHours() != null) {
            pip.setCompletedHours(request.getCompletedHours());
        }

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
                notificationService.send(pip.getEmployee().getUserAccount(), title, message, "PIP");
            }
            if (pip.getManager() != null && pip.getManager().getUserAccount() != null) {
                notificationService.send(pip.getManager().getUserAccount(), title, message, "PIP");
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
            throw new RuntimeException("Only the assigned manager can mark the PIP result");
        }
        if (!STATUS_AUTO_CLOSED.equals(normalizeStatus(pip.getStatus()))) {
            throw new RuntimeException("The PIP result can only be marked after the PIP is automatically closed");
        }
        if (pip.getFinalOutcome() != null && !pip.getFinalOutcome().isBlank()) {
            throw new RuntimeException("The final result has already been marked");
        }
        String outcome = normalizeStatus(request.getFinalOutcome());
        if (!"SUCCESSFUL".equals(outcome) && !"FAILED".equals(outcome)) {
            throw new RuntimeException("Final result must be Successful or Failed");
        }
        if (request.getClosingRemarks() == null || request.getClosingRemarks().trim().isEmpty()) {
            throw new RuntimeException("Manager comments are required");
        }
        pip.setStatus(STATUS_CLOSED);
        if (pip.getFinalCloseDate() == null) {
            pip.setFinalCloseDate(LocalDate.now());
        }
        pip.setActualEndDate(pip.getFinalCloseDate());
        pip.setClosingRemarks(request.getClosingRemarks().trim());
        pip.setFinalOutcome(outcome);
        pip.setReviewReason(null);
        pip.setClosedBy(actor.getEmployee());
        pip.setClosedDate(Instant.now());
        pip.setUpdatedDate(Instant.now());
        return pipRepository.save(pip);
    }

    @Transactional
    public Pip reopenPip(Long pipId, PipReopenRequest request, User actor) {
        Pip pip = getPipById(pipId, actor);
        if (!isPipEmployee(pip, actor)) {
            throw new RuntimeException("Only the employee assigned to this PIP can request reopening");
        }
        if (!STATUS_AUTO_CLOSED.equals(normalizeStatus(pip.getStatus()))) {
            throw new RuntimeException("Only automatically closed PIPs can be requested for reopening");
        }
        if (hasReopenBeenUsed(pip)) {
            throw new RuntimeException("A PIP can only be reopened one time");
        }
        if (pip.getFinalOutcome() != null && !pip.getFinalOutcome().isBlank()) {
            throw new RuntimeException("A PIP cannot be reopened after the final result is marked");
        }
        if (request.getReason() == null || request.getReason().trim().isEmpty()) {
            throw new RuntimeException("Reopen reason is required");
        }
        pip.setStatus(STATUS_REOPEN_REQUESTED);
        pip.setReopenReason(request.getReason().trim());
        pip.setReviewReason(null);
        pip.setReopenedBy(null);
        pip.setReopenedDate(null);
        pip.setReopenDecision(null);
        pip.setReopenDecisionDate(null);
        pip.setUpdatedDate(Instant.now());
        return pipRepository.save(pip);
    }

    @Transactional
    public Pip reviewPip(Long pipId, PipReviewRequest request, User actor) {
        Pip pip = getPipById(pipId, actor);
        if (!isDirectManager(pip, actor)) {
            throw new RuntimeException("Only the assigned manager can review a reopen request");
        }
        String normalizedStatus = normalizeStatus(pip.getStatus());
        String action = request.getAction() == null ? "" : request.getAction().trim().toUpperCase(Locale.ROOT);
        String reason = request.getReason() == null ? null : request.getReason().trim();

        if (!STATUS_REOPEN_REQUESTED.equals(normalizedStatus)) {
            throw new RuntimeException("Only employee reopen requests can be reviewed");
        }
        if ("DENIED".equals(action) && (reason == null || reason.isEmpty())) {
            throw new RuntimeException("Deny reason is required");
        }

        if ("CONFIRMED".equals(action)) {
            if (request.getExtendedEndDate() == null) {
                throw new RuntimeException("Extended end date is required when approving a reopen request");
            }
            LocalDate minimumDate = LocalDate.now().plusDays(1);
            if (request.getExtendedEndDate().isBefore(minimumDate)) {
                throw new RuntimeException("Extended end date must be after today");
            }
            pip.setStatus(STATUS_ACTIVE);
            pip.setEndDate(request.getExtendedEndDate());
            pip.setExtendedEndDate(request.getExtendedEndDate());
            pip.setActualEndDate(null);
            pip.setReopenedBy(actor.getEmployee());
            pip.setReopenedDate(Instant.now());
            pip.setReopenDecision(DECISION_APPROVED);
            pip.setReopenDecisionDate(Instant.now());
            pip.setReviewReason(null);
        } else if ("DENIED".equals(action)) {
            pip.setStatus(STATUS_AUTO_CLOSED);
            pip.setReopenDecision(DECISION_REJECTED);
            pip.setReopenDecisionDate(Instant.now());
            pip.setReviewReason(reason);
        } else {
            throw new RuntimeException("Review action must be CONFIRMED or DENIED");
        }
        pip.setUpdatedDate(Instant.now());
        return pipRepository.save(pip);
    }

    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void autoCloseExpiredPips() {
        LocalDate today = LocalDate.now();
        List<Pip> expiredPips = pipRepository.findByStatusInAndEndDateLessThanEqual(List.of(STATUS_ACTIVE), today);
        for (Pip pip : expiredPips) {
            autoClosePip(pip, today);
        }
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
            pip.setCompletedHours(0);
            return;
        }

        double totalWeightedProgress = 0.0;
        double totalWeight = 0.0;

        for (PipObjective obj : objectives) {
            double weight = obj.getWeightPercentage() != null ? obj.getWeightPercentage().doubleValue() : 0.0;
            double progress = obj.getProgressPercentage() != null ? obj.getProgressPercentage().doubleValue() : 0.0;
            totalWeightedProgress += (progress * weight);
            totalWeight += weight;
        }

        double overallPercentage = totalWeight > 0 ? (totalWeightedProgress / totalWeight) : 0.0;
        pip.setOverallProgressPercentage(BigDecimal.valueOf(overallPercentage).setScale(2, RoundingMode.HALF_UP));

        // Update completed hours ONLY if it's currently null or if it was never set
        // Note: If updateObjectiveProgress already set it from manual input, we don't
        // overwrite it here
        // However, if we want the automated calculation to always run UNLESS manual is
        // provided,
        // we can check if the value changed. For now, let's make it smarter:
        if (pip.getTotalHours() != null && (pip.getCompletedHours() == null || pip.getCompletedHours() == 0)) {
            int calculatedHours = (int) Math.round((overallPercentage / 100.0) * pip.getTotalHours());
            pip.setCompletedHours(calculatedHours);
        }
    }

    private Employee requireManagerEmployee(User actor) {
        if (actor.getEmployee() == null) {
            throw new RuntimeException("The current account is not linked to an employee record");
        }
        return actor.getEmployee();
    }

    private void autoClosePip(Pip pip, LocalDate closeDate) {
        if (pip.getOriginalEndDate() == null) {
            pip.setOriginalEndDate(pip.getEndDate());
        }
        pip.setStatus(STATUS_AUTO_CLOSED);
        pip.setActualEndDate(closeDate);
        if (hasReopenBeenUsed(pip)) {
            pip.setFinalCloseDate(closeDate);
        } else if (pip.getAutoCloseDate() == null) {
            pip.setAutoCloseDate(closeDate);
        }
        pip.setUpdatedDate(Instant.now());
        pipRepository.save(pip);
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
        String role = actor.getRole() != null ? actor.getRole().getName().trim().toUpperCase().replace(" ", "_") : "";
        if (("DEPARTMENT_HEAD".equals(role) || "TEAM_HEAD".equals(role))
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

    private boolean isPipEmployee(Pip pip, User actor) {
        return actor.getEmployee() != null
                && pip.getEmployee() != null
                && pip.getEmployee().getId().equals(actor.getEmployee().getId());
    }

    private boolean hasReopenBeenUsed(Pip pip) {
        return pip.getReopenReason() != null && !pip.getReopenReason().isBlank();
    }

    private boolean isHr(User actor) {
        return actor.getRole() != null && "HR".equalsIgnoreCase(actor.getRole().getName());
    }

    private boolean isManagedBy(Employee employee, Long managerEmployeeId) {
        if (employee == null || managerEmployeeId == null || employee.getDepartment() == null) {
            return false;
        }
        Long departmentManagerId = employee.getDepartment().getManagerId();
        return departmentManagerId != null && departmentManagerId.equals(managerEmployeeId);
    }

    private String normalizeStatus(String status) {
        return status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
    }
}
