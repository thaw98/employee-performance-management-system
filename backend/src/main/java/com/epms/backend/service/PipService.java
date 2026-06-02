package com.epms.backend.service;

import com.epms.backend.StaffTypes;
import com.epms.backend.dto.pip.PipCreateRequest;
import com.epms.backend.dto.pip.EligibleEmployeeDTO;
import com.epms.backend.dto.pip.ProgressUpdateRequest;
import com.epms.backend.dto.pip.PipObjectiveHoursIncreaseRequest;
import com.epms.backend.dto.pip.MeetingScheduleRequest;
import com.epms.backend.dto.pip.PipCloseRequest;
import com.epms.backend.dto.pip.PipExtendDateRequest;
import com.epms.backend.dto.pip.PipReopenRequest;
import com.epms.backend.dto.pip.PipSignatureRequest;
import com.epms.backend.dto.pip.PipReviewRequest;
import com.epms.backend.dto.pip.PipCommunicationNoteDto;
import com.epms.backend.dto.pip.PipCommunicationNotePageDto;
import com.epms.backend.dto.pip.PipCommunicationNoteRequest;
import com.epms.backend.entity.*;
import com.epms.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.Arrays;
import java.util.Optional;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;

@Service
@RequiredArgsConstructor
public class PipService {

    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_AUTO_CLOSED = "AUTO_CLOSED";
    private static final String STATUS_REOPEN_REQUESTED = "REOPEN_REQUESTED";
    private static final String STATUS_CLOSED = "CLOSED";
    private static final String STATUS_COMPLETED = "COMPLETED";
    private static final String STATUS_DENIED = "DENIED";
    private static final String STATUS_SCHEDULED = "SCHEDULED";
    private static final String DECISION_APPROVED = "APPROVED";
    private static final String DECISION_REJECTED = "REJECTED";
    private static final BigDecimal PIP_KPI_SCORE_THRESHOLD = BigDecimal.valueOf(50);
    private static final BigDecimal MAX_PIP_HOURS_PER_DAY = BigDecimal.valueOf(5);
    private static final String PIP_HOURS_LIMIT_MESSAGE = "Cannot update PIP hours because the total PIP hours exceed the allowed completion time. Please extend the PIP date instead.";

    private final PipRepository pipRepository;
    private final PipObjectiveRepository objectiveRepository;
    private final PipProgressUpdateRepository progressUpdateRepository;
    private final FollowUpMeetingRepository meetingRepository;
    private final TrainingRecordRepository trainingRepository;
    private final EmployeeRepository employeeRepository;
    private final PipCommunicationNoteRepository communicationNoteRepository;
    private final SignatureRepository signatureRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final KpiRepository kpiRepository;

    public List<EligibleEmployeeDTO> getLowPerformers(User manager) {
        if (manager.getEmployee() == null) {
            return new ArrayList<>();
        }
        Employee managerEmployee = manager.getEmployee();
        Long managerEmployeeId = managerEmployee.getId();
        return employeeRepository.findAll().stream()
                .filter(employee -> employee.getId() != null && !employee.getId().equals(managerEmployeeId))
                .filter(employee -> isManagedBy(employee, managerEmployee))
                .filter(employee -> !isProbationEmployee(employee))
                .filter(employee -> !hasBlockingPip(employee))
                .map(employee -> new EligibleEmployeeWithScore(employee, getLatestKpiTotalScore(employee)))
                .filter(candidate -> candidate.totalScore() != null
                        && candidate.totalScore().compareTo(PIP_KPI_SCORE_THRESHOLD) <= 0)
                .map(employee -> new EligibleEmployeeDTO(
                        employee.employee().getId(),
                        employee.employee().getEmployeeId(),
                        employee.employee().getEmployeeName(),
                        employee.employee().getDepartment() == null ? null
                                : employee.employee().getDepartment().getName(),
                        employee.totalScore()))
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<Long> findOpenPipIdForEmployee(Long employeeId) {
        if (employeeId == null) {
            return Optional.empty();
        }
        Employee employee = employeeRepository.findById(employeeId).orElse(null);
        if (employee == null) {
            return Optional.empty();
        }
        return pipRepository.findByEmployeeAndStatusIn(employee,
                List.of(STATUS_ACTIVE, STATUS_AUTO_CLOSED, STATUS_REOPEN_REQUESTED))
                .stream()
                .filter(pip -> !STATUS_CLOSED.equalsIgnoreCase(pip.getStatus())
                        && !STATUS_DENIED.equalsIgnoreCase(pip.getStatus()))
                .map(Pip::getId)
                .findFirst();
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
        boolean hasBlankObjective = request.getObjectives().stream()
                .anyMatch(objective -> objective == null || objective.trim().isEmpty());
        if (hasBlankObjective) {
            throw new RuntimeException("Objective is required");
        }
        if (request.getExpectedImprovements() == null || request.getExpectedImprovements().trim().isEmpty()) {
            throw new RuntimeException("Expected improvement is required for each objective");
        }
        long expectedImprovementCount = Arrays.stream(request.getExpectedImprovements().split("\\R"))
                .filter(line -> line != null && !line.trim().isEmpty())
                .count();
        if (expectedImprovementCount < request.getObjectives().size()) {
            throw new RuntimeException("Expected improvement is required for each objective");
        }
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        if (!isManagedBy(employee, managerEmployee)) {
            throw new RuntimeException("You can only create PIPs for employees under your supervision");
        }
        if (isProbationEmployee(employee)) {
            throw new RuntimeException("Probation employees cannot be assigned to PIP");
        }
        BigDecimal kpiScore = getLatestKpiTotalScore(employee);
        if (kpiScore == null || kpiScore.compareTo(PIP_KPI_SCORE_THRESHOLD) > 0) {
            throw new RuntimeException("Only employees with KPI score 50% or below can be assigned to PIP");
        }
        if (request.getTotalHours() == null || request.getTotalHours() < 1) {
            throw new RuntimeException("Total hours must be at least 1");
        }
        BigDecimal maxHours = calculateAllowedPipHours(request.getStartDate(), request.getEndDate());
        if (BigDecimal.valueOf(request.getTotalHours()).compareTo(maxHours) > 0) {
            throw new RuntimeException(PIP_HOURS_LIMIT_MESSAGE);
        }

        if (findOpenPipIdForEmployee(employee.getId()).isPresent()) {
            throw new RuntimeException("An active PIP already exists for this employee");
        }

        Pip pip = new Pip();
        pip.setEmployee(employee);
        pip.setManager(managerEmployee);
        pip.setCreatedBy(managerEmployee);
        pip.setStartDate(request.getStartDate());
        pip.setEndDate(request.getEndDate());
        pip.setOriginalEndDate(request.getEndDate());
        updateAutoCloseDate(pip);
        pip.setStatus(STATUS_ACTIVE);
        pip.setOverallProgressPercentage(BigDecimal.ZERO);
        pip.setTotalHours(request.getTotalHours());
        pip.setCompletedHours(0);
        pip.setCreatedDate(Instant.now());
        pip.setUpdatedDate(Instant.now());
        pip.setExpectedImprovements(request.getExpectedImprovements());
        pip.setReasonForPlan(request.getReasonForPlan());
        pip.setKpiScore(kpiScore);

        BigDecimal objectiveWeight = BigDecimal.valueOf(100)
                .divide(BigDecimal.valueOf(request.getObjectives().size()), 2, RoundingMode.HALF_UP);
        BigDecimal objectiveHours = BigDecimal.valueOf(request.getTotalHours())
                .divide(BigDecimal.valueOf(request.getObjectives().size()), 2, RoundingMode.HALF_UP);

        List<PipObjective> objectives = request.getObjectives().stream().map(desc -> {
            PipObjective obj = new PipObjective();
            obj.setDescription(desc.trim());
            obj.setPip(pip);
            obj.setDueDate(request.getEndDate() != null ? request.getEndDate() : LocalDate.now());
            obj.setWeightPercentage(objectiveWeight);
            obj.setTargetValue(objectiveHours);
            obj.setCurrentValue(BigDecimal.ZERO);
            obj.setStatus("Not_Started");
            return obj;
        }).toList();

        pip.setObjectives(objectives);

        Pip savedPip = pipRepository.save(pip);
        syncTrainingRecords(savedPip);
        notifyPipRelatedUsers(savedPip, manager, "PIP created");
        return savedPip;
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

    public List<Pip> searchPips(Long departmentId, Long positionId, Long pipId, String employeeName, String status,
            LocalDate startDate, LocalDate endDate, User actor) {
        autoCloseExpiredPips();
        Specification<Pip> spec = (root, query, cb) -> {
            // Eagerly fetch nested entities to avoid LazyInitializationException and ensure
            // data is present in JSON
            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                query.distinct(true);
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
            String roleName = normalizeRoleName(actor);
            boolean isAdmin = "ADMIN".equals(roleName) || "SUPER_ADMIN".equals(roleName);
            boolean isManager = isManagerRole(actor);

            if (isHr(actor) || isAudit(actor) || isAdmin) {
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

            if (pipId != null) {
                predicates.add(cb.equal(root.get("id"), pipId));
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

        return pipRepository.findAll(spec).stream()
                .peek(this::attachKpiScore)
                .toList();
    }

    public Pip getPipById(Long id, User actor) {
        autoCloseExpiredPips();
        Pip pip = pipRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PIP not found"));
        authorizePipAccess(pip, actor);
        attachKpiScore(pip);
        return pip;
    }

    @Transactional(readOnly = true)
    public PipCommunicationNotePageDto getPipNotes(Long pipId, String noteType, Pageable pageable, User actor) {
        Pip pip = getPipById(pipId, actor);
        PipNoteType parsedNoteType = parseNoteType(noteType, null);
        Specification<PipCommunicationNote> spec = (root, query, cb) -> {
            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                jakarta.persistence.criteria.Fetch<PipCommunicationNote, Pip> pipFetch = root.fetch("pip",
                        jakarta.persistence.criteria.JoinType.LEFT);
                pipFetch.fetch("employee", jakarta.persistence.criteria.JoinType.LEFT);
                pipFetch.fetch("manager", jakarta.persistence.criteria.JoinType.LEFT);
                jakarta.persistence.criteria.Fetch<PipCommunicationNote, User> authorFetch = root.fetch("author",
                        jakarta.persistence.criteria.JoinType.LEFT);
                authorFetch.fetch("employee", jakarta.persistence.criteria.JoinType.LEFT);
            }

            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("pip").get("id"), pip.getId()));
            if (parsedNoteType != null) {
                predicates.add(cb.equal(root.get("noteType"), parsedNoteType));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        Page<PipCommunicationNoteDto> page = communicationNoteRepository.findAll(spec, pageable).map(this::toNoteDto);
        return new PipCommunicationNotePageDto(
                page.getContent(),
                page.getTotalPages(),
                page.getTotalElements(),
                page.getNumber(),
                page.hasNext());
    }

    @Transactional
    public PipCommunicationNoteDto addPipNote(Long pipId, PipCommunicationNoteRequest request, User actor) {
        Pip pip = getPipById(pipId, actor);
        if (!STATUS_ACTIVE.equals(normalizeStatus(pip.getStatus()))) {
            throw new RuntimeException("Notes can only be added to active PIPs");
        }
        if (!isDirectManager(pip, actor) && !isPipEmployee(pip, actor)) {
            throw new RuntimeException("Only the assigned employee or manager can add notes");
        }
        if (request == null || request.getContent() == null || request.getContent().trim().isEmpty()) {
            throw new RuntimeException("Note content is required");
        }
        PipNoteType parsedNoteType = parseNoteType(request.getNoteType(), PipNoteType.COMMUNICATION);
        if (parsedNoteType == PipNoteType.FOLLOWUP && !isInsideFollowUpMeetingWindow(pip)) {
            throw new RuntimeException("Follow-up notes can only be added during a scheduled follow-up meeting time.");
        }

        PipCommunicationNote note = new PipCommunicationNote();
        note.setPip(pip);
        note.setContent(request.getContent().trim());
        note.setNoteType(parsedNoteType);
        note.setAuthor(actor);
        note.setCreatedDate(Instant.now());
        note.setUpdatedDate(Instant.now());
        PipCommunicationNote savedNote = communicationNoteRepository.save(note);
        notifyPipRelatedUsers(pip, actor,
                (savedNote.getNoteType() == PipNoteType.FOLLOWUP ? "Followup note added" : "Communication note added"));
        return toNoteDto(savedNote);
    }

    @Transactional
    public PipCommunicationNoteDto updatePipNote(Long noteId, PipCommunicationNoteRequest request, User actor) {
        PipCommunicationNote note = communicationNoteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("PIP note not found"));
        if (!isHr(actor) && (note.getAuthor() == null || !note.getAuthor().getId().equals(actor.getId()))) {
            throw new RuntimeException("Only the note author or HR can edit this note");
        }
        if (request == null || request.getContent() == null || request.getContent().trim().isEmpty()) {
            throw new RuntimeException("Note content is required");
        }
        if (note.getNoteType() == PipNoteType.FOLLOWUP && !isInsideFollowUpMeetingWindow(note.getPip())) {
            throw new RuntimeException("Follow-up notes can only be edited during a scheduled follow-up meeting time.");
        }

        note.setContent(request.getContent().trim());
        note.setUpdatedDate(Instant.now());
        PipCommunicationNote savedNote = communicationNoteRepository.save(note);
        notifyPipRelatedUsers(savedNote.getPip(), actor, "PIP note updated");
        return toNoteDto(savedNote);
    }

    @Transactional(readOnly = true)
    public Page<PipCommunicationNoteDto> getAllPipNotes(
            Long employeeId,
            Long managerId,
            Long departmentId,
            String employeeName,
            String noteType,
            String pipStatus,
            LocalDate dateFrom,
            LocalDate dateTo,
            Pageable pageable,
            User actor) {
        if (!isHr(actor) && !isAudit(actor)) {
            throw new RuntimeException("Only HR or Audit can review all PIP notes");
        }
        if (dateFrom != null && dateTo != null && dateFrom.isAfter(dateTo)) {
            throw new IllegalArgumentException("Date From must be on or before Date To");
        }
        PipNoteType parsedNoteType = parseNoteType(noteType, null);

        Specification<PipCommunicationNote> spec = (root, query, cb) -> {
            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                jakarta.persistence.criteria.Fetch<PipCommunicationNote, Pip> pipFetch = root.fetch("pip",
                        jakarta.persistence.criteria.JoinType.LEFT);
                pipFetch.fetch("employee", jakarta.persistence.criteria.JoinType.LEFT);
                pipFetch.fetch("manager", jakarta.persistence.criteria.JoinType.LEFT);
                jakarta.persistence.criteria.Fetch<PipCommunicationNote, User> authorFetch = root.fetch("author",
                        jakarta.persistence.criteria.JoinType.LEFT);
                authorFetch.fetch("employee", jakarta.persistence.criteria.JoinType.LEFT);
            }

            List<Predicate> predicates = new ArrayList<>();
            if (employeeId != null) {
                predicates.add(cb.equal(root.get("pip").get("employee").get("id"), employeeId));
            }
            if (managerId != null) {
                predicates.add(cb.equal(root.get("pip").get("manager").get("id"), managerId));
            }
            if (departmentId != null) {
                predicates.add(cb.equal(root.get("pip").get("employee").get("department").get("id"), departmentId));
            }
            if (employeeName != null && !employeeName.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("pip").get("employee").get("employeeName")),
                        "%" + employeeName.toLowerCase(Locale.ROOT) + "%"));
            }
            if (parsedNoteType != null) {
                predicates.add(cb.equal(root.get("noteType"), parsedNoteType));
            }
            if (pipStatus != null && !pipStatus.isBlank()) {
                predicates.add(cb.equal(root.get("pip").get("status"), normalizeStatus(pipStatus)));
            }
            if (dateFrom != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdDate"),
                        dateFrom.atStartOfDay(java.time.ZoneOffset.UTC).toInstant()));
            }
            if (dateTo != null) {
                predicates.add(cb.lessThan(root.get("createdDate"),
                        dateTo.plusDays(1).atStartOfDay(java.time.ZoneOffset.UTC).toInstant()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return communicationNoteRepository.findAll(spec, pageable).map(this::toNoteDto);
    }

    @Transactional
    public void deletePipNote(Long noteId, User actor) {
        PipCommunicationNote note = communicationNoteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("PIP note not found"));
        if (!isHr(actor) && (note.getAuthor() == null || !note.getAuthor().getId().equals(actor.getId()))) {
            throw new RuntimeException("Only the note author or HR can delete this note");
        }
        communicationNoteRepository.delete(note);
    }

    @Transactional
    public PipObjective updateObjectiveProgress(Long objectiveId, ProgressUpdateRequest request, User updatedBy) {
        throw new RuntimeException(
                "Manual progress editing is no longer supported. Increase objective hours or use employee PIP timer sessions instead.");
    }

    @Transactional
    public PipObjective increaseObjectiveHours(Long objectiveId, PipObjectiveHoursIncreaseRequest request, User actor) {
        PipObjective objective = objectiveRepository.findById(objectiveId)
                .orElseThrow(() -> new RuntimeException("Objective not found"));
        Pip pip = objective.getPip();
        authorizeManagerAction(pip, actor);
        ensureActivePip(pip, "Cannot increase hours on a closed PIP");
        if (request.getAdditionalHours() == null || request.getAdditionalHours().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Additional hours must be greater than 0");
        }
        if (request.getNote() == null || request.getNote().trim().isEmpty()) {
            throw new RuntimeException("A note is required when increasing PIP hours");
        }

        BigDecimal newObjectiveHours = safeDecimal(objective.getTargetValue()).add(request.getAdditionalHours());
        BigDecimal newTotalObjectiveHours = calculateTotalObjectiveHours(pip)
                .subtract(safeDecimal(objective.getTargetValue()))
                .add(newObjectiveHours);
        validatePipObjectiveHoursWithinAllowedDuration(pip, newTotalObjectiveHours);

        objective.setTargetValue(newObjectiveHours);
        objective.setUpdatedDate(Instant.now());
        pip.setTotalHours(calculateTotalObjectiveHours(pip).intValue());
        recalculatePipHoursAndProgress(pip);

        PipProgressUpdate update = new PipProgressUpdate();
        update.setPip(pip);
        update.setObjective(objective);
        update.setPreviousPercentage(objective.getProgressPercentage());
        update.setNewPercentage(objective.getProgressPercentage());
        update.setFeedback(request.getNote().trim());
        update.setUpdatedBy(actor.getEmployee());
        update.setUpdateDate(LocalDate.now());
        update.setCreatedDate(Instant.now());
        update.setCompletedHours(null);
        progressUpdateRepository.save(update);

        pipRepository.save(pip);
        notifyPipRelatedUsers(pip, actor, "PIP objective hours increased");
        return objectiveRepository.save(objective);
    }

    @Transactional
    public PipObjective startObjectiveSession(Long objectiveId, User actor) {
        PipObjective objective = objectiveRepository.findById(objectiveId)
                .orElseThrow(() -> new RuntimeException("Objective not found"));
        Pip pip = objective.getPip();
        authorizeEmployeeAction(pip, actor);
        ensureActivePip(pip, "Cannot start a timer on a closed PIP");
        if (objective.getActiveSessionStart() != null) {
            throw new RuntimeException("This objective already has an active PIP timer");
        }
        if (objectiveRepository.existsByPip_Employee_IdAndActiveSessionStartIsNotNull(pip.getEmployee().getId())) {
            throw new RuntimeException("Please end the active PIP timer before starting another objective");
        }
        if (objective.getRemainingHours().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("This objective is already completed");
        }
        objective.setActiveSessionStart(Instant.now());
        objective.setStatus("In_Progress");
        objective.setUpdatedDate(Instant.now());
        return objectiveRepository.save(objective);
    }

    @Transactional
    public PipObjective endObjectiveSession(Long objectiveId, User actor) {
        PipObjective objective = objectiveRepository.findById(objectiveId)
                .orElseThrow(() -> new RuntimeException("Objective not found"));
        authorizeEmployeeAction(objective.getPip(), actor);
        endObjectiveSessionInternal(objective, Instant.now(), actor.getEmployee(), "PIP session ended");
        return objectiveRepository.save(objective);
    }

    @Transactional
    public void endActiveEmployeeSessions(User actor) {
        if (actor.getEmployee() == null)
            return;
        List<Pip> pips = pipRepository.findByEmployee(actor.getEmployee());
        Instant endedAt = Instant.now();
        for (Pip pip : pips) {
            if (pip.getObjectives() == null)
                continue;
            for (PipObjective objective : pip.getObjectives()) {
                if (objective.getActiveSessionStart() != null) {
                    endObjectiveSessionInternal(objective, endedAt, actor.getEmployee(), "PIP session auto-ended");
                    objectiveRepository.save(objective);
                }
            }
        }
    }

    @Scheduled(fixedRate = 300000)
    @Transactional
    public void recoverStaleObjectiveSessions() {
        Instant cutoff = Instant.now().minus(8, ChronoUnit.HOURS);
        List<PipObjective> staleObjectives = objectiveRepository.findByActiveSessionStartBefore(cutoff);
        for (PipObjective objective : staleObjectives) {
            Employee employee = objective.getPip() == null ? null : objective.getPip().getEmployee();
            endObjectiveSessionInternal(objective, Instant.now(), employee, "PIP session recovered after inactivity");
            objectiveRepository.save(objective);
        }
    }

    @Transactional
    public FollowUpMeeting scheduleMeeting(Long pipId, MeetingScheduleRequest request, User actor) {
        Pip pip = getPipById(pipId, actor);
        authorizeManagerAction(pip, actor);

        if (!STATUS_ACTIVE.equals(normalizeStatus(pip.getStatus()))
                && !"REOPENED".equals(normalizeStatus(pip.getStatus()))) {
            throw new RuntimeException("Meetings can only be scheduled for active PIPs");
        }
        LocalDateTime startMeetingTime = request.getStartMeetingTime() != null
                ? request.getStartMeetingTime()
                : request.getMeetingTime();
        LocalDateTime endMeetingTime = request.getEndMeetingTime();
        if (startMeetingTime == null || endMeetingTime == null) {
            throw new RuntimeException("Start meeting time and end meeting time are required");
        }
        if (!endMeetingTime.isAfter(startMeetingTime)) {
            throw new RuntimeException("End meeting time must be after start meeting time");
        }
        if (startMeetingTime.toLocalDate().isBefore(pip.getStartDate())
                || startMeetingTime.toLocalDate().isAfter(pip.getEndDate())
                || endMeetingTime.toLocalDate().isBefore(pip.getStartDate())
                || endMeetingTime.toLocalDate().isAfter(pip.getEndDate())) {
            throw new RuntimeException("Meeting time must be within the PIP date range");
        }

        FollowUpMeeting meeting = new FollowUpMeeting();
        meeting.setPip(pip);
        meeting.setMeetingWindow(startMeetingTime, endMeetingTime);
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

        notifyPipRelatedUsers(pip, actor, "Follow-up meeting scheduled");

        return savedMeeting;
    }

    private boolean isInsideFollowUpMeetingWindow(Pip pip) {
        if (pip == null || pip.getFollowUpMeetings() == null) {
            return false;
        }
        LocalDateTime now = LocalDateTime.now();
        return pip.getFollowUpMeetings().stream().anyMatch(meeting -> {
            LocalDateTime start = meeting.getStartMeetingTime();
            LocalDateTime end = meeting.getEndMeetingTime();
            return start != null && end != null && !now.isBefore(start) && !now.isAfter(end);
        });
    }

    @Transactional
    public Pip manualClosePip(Long pipId, User actor) {
        Pip pip = getPipById(pipId, actor);
        if (!isDirectManager(pip, actor)) {
            throw new RuntimeException("Only the assigned manager can manually close this PIP");
        }
        if (!STATUS_ACTIVE.equals(normalizeStatus(pip.getStatus()))) {
            throw new RuntimeException("Only active PIPs can be manually closed");
        }
        autoClosePip(pip, LocalDate.now(), "PIP manually closed");
        return pip;
    }

    @Transactional
    public Pip extendPipDate(Long pipId, PipExtendDateRequest request, User actor) {
        Pip pip = getPipById(pipId, actor);
        authorizeManagerAction(pip, actor);
        ensureActivePip(pip, "Only active PIPs can be extended");
        if (request == null || request.getExtendedEndDate() == null) {
            throw new RuntimeException("Extended end date is required");
        }
        LocalDate currentEffectiveEndDate = getEffectiveEndDate(pip);
        if (currentEffectiveEndDate == null || !request.getExtendedEndDate().isAfter(currentEffectiveEndDate)) {
            throw new RuntimeException("Extended end date must be after the current PIP end date");
        }
        if (pip.getOriginalEndDate() == null) {
            pip.setOriginalEndDate(pip.getEndDate());
        }
        pip.setEndDate(request.getExtendedEndDate());
        pip.setExtendedEndDate(request.getExtendedEndDate());
        updateAutoCloseDate(pip);
        pip.setUpdatedDate(Instant.now());
        Pip savedPip = pipRepository.save(pip);
        notifyPipRelatedUsers(savedPip, actor, "PIP date extended");
        return savedPip;
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
        if (pip.getEmployeeSignatureDate() == null) {
            throw new RuntimeException(
                    "The employee must sign the PIP result before the manager can mark the final result");
        }
        if (pip.getManagerSignatureDate() == null) {
            throw new RuntimeException("The manager must sign the PIP result before marking the final result");
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
        if (pip.getFinalCloseDate() == null) {
            pip.setFinalCloseDate(LocalDate.now());
        }
        pip.setActualEndDate(pip.getFinalCloseDate());
        pip.setClosingRemarks(request.getClosingRemarks().trim());
        pip.setFinalOutcome(outcome);
        pip.setStatus(STATUS_CLOSED);
        pip.setReviewReason(null);
        pip.setClosedBy(actor.getEmployee());
        pip.setClosedDate(Instant.now());
        pip.setUpdatedDate(Instant.now());
        Pip savedPip = pipRepository.save(pip);
        notifyPipRelatedUsers(savedPip, actor, "PIP result marked");
        return savedPip;
    }

    @Transactional
    public Pip markPipCompleted(Long pipId, User actor) {
        Pip pip = getPipById(pipId, actor);
        if (!isDirectManager(pip, actor)) {
            throw new RuntimeException("Only the assigned manager can mark the PIP completed");
        }
        if (!STATUS_CLOSED.equals(normalizeStatus(pip.getStatus()))) {
            throw new RuntimeException("Only CLOSED PIPs can be marked COMPLETED");
        }
        if (pip.getEmployeeSignatureDate() == null || pip.getManagerSignatureDate() == null) {
            throw new RuntimeException("Both employee and manager signatures are required before completion");
        }
        if (pip.getOverallProgressPercentage() == null
                || pip.getOverallProgressPercentage().compareTo(BigDecimal.valueOf(100)) < 0) {
            throw new RuntimeException("PIP progress must be 100% before it can be marked COMPLETED");
        }
        pip.setStatus(STATUS_COMPLETED);
        pip.setUpdatedDate(Instant.now());
        Pip savedPip = pipRepository.save(pip);
        notifyPipRelatedUsers(savedPip, actor, "PIP completed");
        return savedPip;
    }

    @Transactional
    public Pip employeeSign(Long pipId, PipSignatureRequest request, User actor) {
        Pip pip = getPipById(pipId, actor);
        if (!isPipEmployee(pip, actor)) {
            throw new RuntimeException("Only the employee assigned to this PIP can sign it");
        }
        if (!STATUS_AUTO_CLOSED.equals(normalizeStatus(pip.getStatus()))) {
            throw new RuntimeException("Only automatically closed PIPs can be signed by the employee");
        }
        if (pip.getFinalOutcome() != null && !pip.getFinalOutcome().isBlank()) {
            throw new RuntimeException("The employee must sign before the final result is marked");
        }
        if (pip.getEmployeeSignatureDate() != null) {
            throw new RuntimeException("This PIP has already been signed by the employee");
        }
        String signatureData = getDefaultSignatureData(actor, "signing");
        pip.setEmployeeSignature(signatureData);
        pip.setEmployeeSignatureDate(Instant.now());
        pip.setUpdatedDate(Instant.now());
        Pip savedPip = pipRepository.save(pip);
        notifyPipRelatedUsers(savedPip, actor, "Employee signed PIP");
        return savedPip;
    }

    @Transactional
    public Pip managerSign(Long pipId, PipSignatureRequest request, User actor) {
        Pip pip = getPipById(pipId, actor);
        if (!isDirectManager(pip, actor)) {
            throw new RuntimeException("Only the assigned manager can sign this PIP");
        }
        if (!STATUS_AUTO_CLOSED.equals(normalizeStatus(pip.getStatus()))) {
            throw new RuntimeException("Only automatically closed PIPs can be signed by the manager");
        }
        if (pip.getEmployeeSignatureDate() == null) {
            throw new RuntimeException("The employee must sign the PIP result before the manager can sign");
        }
        if (pip.getFinalOutcome() != null && !pip.getFinalOutcome().isBlank()) {
            throw new RuntimeException("The manager must sign before the final result is marked");
        }
        if (pip.getManagerSignatureDate() != null) {
            throw new RuntimeException("This PIP has already been signed by the manager");
        }
        String signatureData = getDefaultSignatureData(actor, "signing");
        pip.setManagerSignature(signatureData);
        pip.setManagerSignatureDate(Instant.now());
        pip.setUpdatedDate(Instant.now());
        Pip savedPip = pipRepository.save(pip);
        notifyPipRelatedUsers(savedPip, actor, "Manager signed PIP");
        return savedPip;
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
        if (pip.getEmployeeSignatureDate() != null) {
            throw new RuntimeException("A PIP cannot be reopened after employee acknowledgement");
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
        pip.setEmployeeSignature(null);
        pip.setEmployeeSignatureDate(null);
        pip.setUpdatedDate(Instant.now());
        Pip savedPip = pipRepository.save(pip);
        notifyPipRelatedUsers(savedPip, actor, "Reopen requested");
        return savedPip;
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
            updateAutoCloseDate(pip);
            pip.setActualEndDate(null);
            pip.setReopenedBy(actor.getEmployee());
            pip.setReopenedDate(Instant.now());
            pip.setReopenDecision(DECISION_APPROVED);
            pip.setReopenDecisionDate(Instant.now());
            pip.setReviewReason(null);
            pip.setEmployeeSignature(null);
            pip.setEmployeeSignatureDate(null);
        } else if ("DENIED".equals(action)) {
            pip.setStatus(STATUS_AUTO_CLOSED);
            pip.setReopenDecision(DECISION_REJECTED);
            pip.setReopenDecisionDate(Instant.now());
            pip.setReviewReason(reason);
        } else {
            throw new RuntimeException("Review action must be CONFIRMED or DENIED");
        }
        pip.setUpdatedDate(Instant.now());
        Pip savedPip = pipRepository.save(pip);
        notifyPipRelatedUsers(savedPip, actor,
                "Reopen request " + ("CONFIRMED".equals(action) ? "approved" : "denied"));
        return savedPip;
    }

    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void autoCloseExpiredPips() {
        LocalDate today = LocalDate.now();
        List<Pip> expiredPips = pipRepository.findByStatusInAndEndDateLessThanEqual(List.of(STATUS_ACTIVE), today);
        for (Pip pip : expiredPips) {
            updateAutoCloseDate(pip);
            if (!today.isBefore(pip.getAutoCloseDate())) {
                autoClosePip(pip, pip.getAutoCloseDate());
            }
        }
    }

    @Transactional
    public List<TrainingRecord> getEmployeeTrainingHistory(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        pipRepository.findByEmployee(employee).forEach(this::syncTrainingRecords);
        return trainingRepository.findByEmployee_IdOrderByStartDateDescCreatedDateDesc(employeeId);
    }

    private void syncTrainingRecords(Pip pip) {
        if (pip.getObjectives() == null) {
            return;
        }
        pip.getObjectives().forEach(objective -> syncTrainingRecord(pip, objective));
    }

    private void syncTrainingRecord(Pip pip, PipObjective objective) {
        syncTrainingRecord(pip, objective, null);
    }

    private void syncTrainingRecord(Pip pip, PipObjective objective, String feedbackNotes) {
        if (pip == null || objective == null || objective.getDescription() == null
                || objective.getDescription().trim().isEmpty()) {
            return;
        }

        String trainingName = objective.getDescription().trim();
        TrainingRecord record = trainingRepository
                .findFirstByPipAndEmployeeAndTrainingName(pip, pip.getEmployee(), trainingName)
                .orElseGet(() -> {
                    TrainingRecord newRecord = new TrainingRecord();
                    newRecord.setEmployee(pip.getEmployee());
                    newRecord.setPip(pip);
                    newRecord.setTrainingName(trainingName);
                    newRecord.setCreatedDate(Instant.now());
                    return newRecord;
                });

        record.setTrainingProvider(pip.getManager() == null ? null : pip.getManager().getEmployeeName());
        String status = resolveTrainingStatus(pip, objective.getProgressPercentage());
        record.setStartDate(pip.getStartDate() == null ? LocalDate.now() : pip.getStartDate());
        record.setEndDate(resolveTrainingEndDate(pip, objective, record, status));
        record.setCompletionStatus(status);
        record.setTotalCompletedHours(pip.getCompletedHours());
        record.setPercentageCompletion(objective.getProgressPercentage());
        if (feedbackNotes != null && !feedbackNotes.isBlank()) {
            record.setFeedbackNotes(feedbackNotes.trim());
        }

        record.setUpdatedDate(Instant.now());
        trainingRepository.save(record);
    }

    private LocalDate resolveTrainingEndDate(Pip pip, PipObjective objective, TrainingRecord record, String status) {
        if ("COMPLETED".equals(status)) {
            if ("COMPLETED".equals(record.getCompletionStatus()) && record.getEndDate() != null) {
                return record.getEndDate();
            }
            if (pip.getActualEndDate() != null) {
                return pip.getActualEndDate();
            }
            if (pip.getFinalCloseDate() != null) {
                return pip.getFinalCloseDate();
            }
            if (pip.getClosedDate() != null) {
                return LocalDate.ofInstant(pip.getClosedDate(), java.time.ZoneId.systemDefault());
            }
            return LocalDate.now();
        }
        if (objective.getDueDate() != null) {
            return objective.getDueDate();
        }
        return pip.getEndDate();
    }

    private String resolveTrainingStatus(Pip pip, Integer progressPercentage) {
        String pipStatus = normalizeStatus(pip.getStatus());
        if (STATUS_CLOSED.equals(pipStatus) || STATUS_COMPLETED.equals(pipStatus)) {
            return "COMPLETED";
        }
        int progress = progressPercentage == null ? 0 : progressPercentage;
        if (progress >= 100) {
            return "COMPLETED";
        }
        if (progress > 0) {
            return "IN_PROGRESS";
        }
        return "NOT_STARTED";
    }

    public List<PipProgressUpdate> getObjectiveHistory(Long objectiveId) {
        PipObjective objective = objectiveRepository.findById(objectiveId)
                .orElseThrow(() -> new RuntimeException("Objective not found"));
        return progressUpdateRepository.findByObjective(objective);
    }

    public List<PipProgressUpdate> getPipHistory(Long pipId, User actor) {
        Pip pip = getPipById(pipId, actor);
        return progressUpdateRepository.findByPipOrderByCreatedDateDesc(pip);
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

    private void recalculatePipHoursAndProgress(Pip pip) {
        BigDecimal total = calculateTotalObjectiveHours(pip);
        BigDecimal completed = calculateCompletedObjectiveHours(pip);
        BigDecimal progress = BigDecimal.ZERO;
        if (total.compareTo(BigDecimal.ZERO) > 0) {
            progress = completed.multiply(BigDecimal.valueOf(100))
                    .divide(total, 2, RoundingMode.HALF_UP);
        }
        if (progress.compareTo(BigDecimal.valueOf(100)) > 0) {
            progress = BigDecimal.valueOf(100);
        }
        pip.setTotalHours(total.setScale(0, RoundingMode.CEILING).intValue());
        pip.setCompletedHours(completed.setScale(0, RoundingMode.FLOOR).intValue());
        pip.setOverallProgressPercentage(progress);
        pip.setUpdatedDate(Instant.now());
    }

    private BigDecimal calculateTotalObjectiveHours(Pip pip) {
        if (pip.getObjectives() == null)
            return BigDecimal.ZERO;
        return pip.getObjectives().stream()
                .map(objective -> safeDecimal(objective.getTargetValue()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void validatePipObjectiveHoursWithinAllowedDuration(Pip pip, BigDecimal totalObjectiveHours) {
        BigDecimal allowedHours = calculateAllowedPipHours(pip);
        if (totalObjectiveHours.compareTo(allowedHours) > 0) {
            throw new RuntimeException(PIP_HOURS_LIMIT_MESSAGE);
        }
    }

    private BigDecimal calculateAllowedPipHours(Pip pip) {
        return calculateAllowedPipHours(pip.getStartDate(), getEffectiveEndDate(pip));
    }

    private BigDecimal calculateAllowedPipHours(LocalDate startDate, LocalDate effectiveEndDate) {
        if (startDate == null || effectiveEndDate == null) {
            return BigDecimal.ZERO;
        }
        long pipDays = Math.max(1L, ChronoUnit.DAYS.between(startDate, effectiveEndDate));
        return MAX_PIP_HOURS_PER_DAY.multiply(BigDecimal.valueOf(pipDays));
    }

    private LocalDate getEffectiveEndDate(Pip pip) {
        return pip.getExtendedEndDate() != null ? pip.getExtendedEndDate() : pip.getEndDate();
    }

    private void updateAutoCloseDate(Pip pip) {
        LocalDate effectiveEndDate = getEffectiveEndDate(pip);
        if (effectiveEndDate != null) {
            pip.setAutoCloseDate(effectiveEndDate.plusDays(1));
        }
    }

    private BigDecimal calculateCompletedObjectiveHours(Pip pip) {
        if (pip.getObjectives() == null)
            return BigDecimal.ZERO;
        return pip.getObjectives().stream()
                .map(objective -> safeDecimal(objective.getCurrentValue()).min(safeDecimal(objective.getTargetValue())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal safeDecimal(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private void endObjectiveSessionInternal(PipObjective objective, Instant endedAt, Employee updatedBy, String note) {
        Instant startedAt = objective.getActiveSessionStart();
        if (startedAt == null) {
            throw new RuntimeException("No active PIP timer found for this objective");
        }
        long seconds = Math.max(0, ChronoUnit.SECONDS.between(startedAt, endedAt));
        BigDecimal elapsedHours = BigDecimal.valueOf(seconds)
                .divide(BigDecimal.valueOf(3600), 4, RoundingMode.HALF_UP);
        BigDecimal total = safeDecimal(objective.getTargetValue());
        BigDecimal completed = safeDecimal(objective.getCurrentValue()).add(elapsedHours).min(total);
        int previousPercentage = objective.getProgressPercentage() == null ? 0 : objective.getProgressPercentage();

        objective.setCurrentValue(completed);
        objective.setActiveSessionStart(null);
        objective.setStatus(objective.getRemainingHours().compareTo(BigDecimal.ZERO) <= 0
                ? "Achieved"
                : completed.compareTo(BigDecimal.ZERO) > 0 ? "In_Progress" : "Not_Started");
        objective.setUpdatedDate(endedAt);

        Pip pip = objective.getPip();
        recalculatePipHoursAndProgress(pip);

        PipProgressUpdate update = new PipProgressUpdate();
        update.setPip(pip);
        update.setObjective(objective);
        update.setPreviousPercentage(previousPercentage);
        update.setNewPercentage(objective.getProgressPercentage());
        update.setFeedback(note + " (" + elapsedHours.setScale(2, RoundingMode.HALF_UP) + " hours)");
        update.setUpdatedBy(updatedBy);
        update.setUpdateDate(LocalDate.now());
        update.setCreatedDate(endedAt);
        update.setCompletedHours(elapsedHours.setScale(0, RoundingMode.FLOOR).intValue());
        progressUpdateRepository.save(update);
        pipRepository.save(pip);
        sendPipTimerStoppedNotification(objective, seconds, endedAt);
    }

    private void sendPipTimerStoppedNotification(PipObjective objective, long trackedSeconds, Instant endedAt) {
        Pip pip = objective.getPip();
        if (pip == null || pip.getEmployee() == null) {
            return;
        }
        String employeeName = pip.getEmployee().getEmployeeName() == null
                ? "Unknown employee"
                : pip.getEmployee().getEmployeeName();
        String objectiveName = objective.getDescription() == null || objective.getDescription().isBlank()
                ? "PIP objective"
                : objective.getDescription().trim();
        String duration = formatTrackedTimerDuration(trackedSeconds);
        String completedAt = DateTimeFormatter.ofPattern("dd MMM yyyy hh:mm a", Locale.ENGLISH)
                .withZone(ZoneId.systemDefault())
                .format(endedAt);
        String message = String.format(
                "%s did %s PIP for %s. Completed at %s.",
                employeeName,
                objectiveName,
                duration,
                completedAt);

        Set<User> recipients = new LinkedHashSet<>();
        if (pip.getEmployee().getUserAccount() != null) {
            recipients.add(pip.getEmployee().getUserAccount());
        }
        if (pip.getManager() != null && pip.getManager().getUserAccount() != null) {
            recipients.add(pip.getManager().getUserAccount());
        }
        recipients.stream()
                .filter(user -> user != null && user.isActive())
                .forEach(user -> notificationService.send(user, "PIP Timer Completed", message, "PIP", pip.getId()));
    }

    private String formatTrackedTimerDuration(long trackedSeconds) {
        long totalMinutes = trackedSeconds <= 0 ? 0 : Math.max(1, Math.round(trackedSeconds / 60.0));
        long hours = totalMinutes / 60;
        long minutes = totalMinutes % 60;
        return String.format("%02d:%02d", hours, minutes);
    }

    private Employee requireManagerEmployee(User actor) {
        if (actor.getEmployee() == null) {
            throw new RuntimeException("The current account is not linked to an employee record");
        }
        return actor.getEmployee();
    }

    private void autoClosePip(Pip pip, LocalDate closeDate) {
        autoClosePip(pip, closeDate, "PIP auto-close");
    }

    private void autoClosePip(Pip pip, LocalDate closeDate, String notificationMessage) {
        if (pip.getOriginalEndDate() == null) {
            pip.setOriginalEndDate(pip.getEndDate());
        }
        updateAutoCloseDate(pip);
        pip.setStatus(STATUS_AUTO_CLOSED);
        pip.setActualEndDate(closeDate);
        if (hasReopenBeenUsed(pip)) {
            pip.setFinalCloseDate(closeDate);
        }
        pip.setUpdatedDate(Instant.now());
        Pip savedPip = pipRepository.save(pip);
        notifyPipRelatedUsers(savedPip, pip.getManager() == null ? null : pip.getManager().getUserAccount(),
                notificationMessage);
    }

    private void authorizePipAccess(Pip pip, User actor) {
        if (isHr(actor) || isAudit(actor)) {
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

        // Allowed if they are the assigned manager and their current role permits
        // manager access.
        if (isManagerRole(actor) && pip.getManager() != null && pip.getManager().getId().equals(actorEmployeeId)) {
            return;
        }

        // Allowed if they are a department/team head and the employee is in their
        // department
        String role = normalizeRoleName(actor);
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

    private void authorizeEmployeeAction(Pip pip, User actor) {
        if (!isPipEmployee(pip, actor)) {
            throw new RuntimeException("Only the assigned employee can perform this action");
        }
    }

    private void ensureActivePip(Pip pip, String message) {
        String status = normalizeStatus(pip.getStatus());
        if (!STATUS_ACTIVE.equals(status) && !"REOPENED".equals(status)) {
            throw new RuntimeException(message);
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

    private String getDefaultSignatureData(User actor, String action) {
        return signatureRepository.findByUserAndIsDefaultTrue(actor)
                .map(Signature::getSignatureData)
                .filter(signatureData -> signatureData != null && !signatureData.isBlank())
                .orElseThrow(() -> new RuntimeException(
                        "No default signature found. Please set up your signature before " + action + "."));
    }

    private boolean isHr(User actor) {
        String name = normalizeRoleName(actor);
        return "HR".equals(name) || "ADMIN".equals(name) || "SUPER_ADMIN".equals(name);
    }

    private boolean isAudit(User actor) {
        if (actor == null || actor.getRole() == null) {
            return false;
        }
        return Long.valueOf(5L).equals(actor.getRole().getId())
                || "AUDIT".equals(actor.getRole().getName().trim().toUpperCase());
    }

    private PipCommunicationNoteDto toNoteDto(PipCommunicationNote note) {
        Pip pip = note.getPip();
        User author = note.getAuthor();
        Employee authorEmployee = author == null ? null : author.getEmployee();
        return new PipCommunicationNoteDto(
                note.getId(),
                pip == null ? null : pip.getId(),
                note.getContent(),
                note.getNoteType() == null ? PipNoteType.COMMUNICATION.name() : note.getNoteType().name(),
                author == null ? null
                        : new PipCommunicationNoteDto.AuthorDto(
                                author.getId(),
                                author.getEmail(),
                                toAuthorEmployeeDto(authorEmployee)),
                pip == null ? null : toPipPersonDto(pip.getEmployee()),
                pip == null ? null : toPipPersonDto(pip.getManager()),
                pip == null ? null : pip.getStatus(),
                note.getCreatedDate(),
                note.getUpdatedDate());
    }

    private PipNoteType parseNoteType(String value, PipNoteType fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        try {
            return PipNoteType.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Note type must be COMMUNICATION or FOLLOWUP");
        }
    }

    private PipCommunicationNoteDto.EmployeeDto toAuthorEmployeeDto(Employee employee) {
        if (employee == null) {
            return null;
        }
        return new PipCommunicationNoteDto.EmployeeDto(
                employee.getId(),
                employee.getEmployeeName(),
                employee.getEmployeeId());
    }

    private PipCommunicationNoteDto.PipPersonDto toPipPersonDto(Employee employee) {
        if (employee == null) {
            return null;
        }
        return new PipCommunicationNoteDto.PipPersonDto(
                employee.getId(),
                employee.getEmployeeName(),
                employee.getEmployeeId(),
                employee.getDepartment() == null ? null : employee.getDepartment().getId(),
                employee.getDepartment() == null ? null : employee.getDepartment().getName());
    }

    private void notifyPipRelatedUsers(Pip pip, User actor, String actionType) {
        if (pip == null) {
            return;
        }
        try {
            Set<User> recipients = new LinkedHashSet<>();
            if (pip.getEmployee() != null && pip.getEmployee().getUserAccount() != null) {
                recipients.add(pip.getEmployee().getUserAccount());
            }
            if (pip.getManager() != null && pip.getManager().getUserAccount() != null) {
                recipients.add(pip.getManager().getUserAccount());
            }
            recipients.addAll(userRepository.findByRole_NameIgnoreCase("HR"));
            if (actor != null) {
                recipients.removeIf(user -> user.getId() != null && user.getId().equals(actor.getId()));
            }
            String title = isManagerActor(actor) ? "PIP Manager Action: " + actionType : "PIP Update: " + actionType;
            String message = buildPipNotificationMessage(pip, actor, actionType);
            recipients.stream()
                    .filter(user -> user != null && user.isActive())
                    .forEach(user -> notificationService.send(user, title, message, "PIP"));
        } catch (Exception ignored) {
            // PIP actions should not fail because notification delivery failed.
        }
    }

    private String buildPipNotificationMessage(Pip pip, User actor, String actionType) {
        String employeeName = pip.getEmployee() == null ? "Unknown employee" : pip.getEmployee().getEmployeeName();
        String managerName = pip.getManager() == null ? "Unknown manager" : pip.getManager().getEmployeeName();
        String timestamp = DateTimeFormatter.ofPattern("dd MMM yyyy hh:mm a", Locale.ENGLISH)
                .withZone(ZoneId.systemDefault())
                .format(Instant.now());
        String actorLabel = isManagerActor(actor) ? "Manager" : "User";
        return String.format(
                "Employee: %s | Manager: %s | %s action: %s | Date/time: %s | PIP reference: PIP #%d",
                employeeName,
                managerName,
                actorLabel,
                actionType,
                timestamp,
                pip.getId());
    }

    private boolean isManagerActor(User actor) {
        String role = normalizeRoleName(actor);
        return "MANAGER".equals(role) || "DEPARTMENT_HEAD".equals(role) || "TEAM_HEAD".equals(role);
    }

    private boolean isManagerRole(User actor) {
        return isManagerActor(actor);
    }

    private String normalizeRoleName(User actor) {
        if (actor == null || actor.getRole() == null || actor.getRole().getName() == null) {
            return "";
        }
        return actor.getRole().getName().trim().toUpperCase(Locale.ROOT).replace(" ", "_");
    }

    private boolean isManagedBy(Employee employee, Employee managerEmployee) {
        if (employee == null || managerEmployee == null || managerEmployee.getId() == null) {
            return false;
        }
        Long managerEmployeeId = managerEmployee.getId();
        if (employee.getManager() != null && employee.getManager().getId().equals(managerEmployeeId)) {
            return true;
        }
        if (employee.getDepartment() != null) {
            Long departmentManagerId = employee.getDepartment().getManagerId();
            if (departmentManagerId != null && departmentManagerId.equals(managerEmployeeId)) {
                return true;
            }
            return managerEmployee.getDepartment() != null
                    && employee.getDepartment().getId() != null
                    && employee.getDepartment().getId().equals(managerEmployee.getDepartment().getId());
        }
        return false;
    }

    private boolean isProbationEmployee(Employee employee) {
        return employee != null
                && employee.getStaffType() != null
                && employee.getStaffType().getId() == StaffTypes.PROBATION;
    }

    private boolean hasBlockingPip(Employee employee) {
        return pipRepository.existsByEmployeeAndStatusIn(employee,
                List.of(STATUS_ACTIVE, STATUS_AUTO_CLOSED, STATUS_REOPEN_REQUESTED));
    }

    public BigDecimal getLatestKpiTotalScore(Employee employee) {
        if (employee == null || employee.getId() == null) {
            return null;
        }
        return kpiRepository.findLatestPeriodByEmployee_Id(employee.getId())
                .map(period -> {
                    List<EmployeeKpi> kpis = kpiRepository.findByEmployee_IdAndPeriod(employee.getId(), period);
                    if (kpis.isEmpty()) {
                        return null;
                    }
                    BigDecimal savedTotal = kpis.stream()
                            .map(EmployeeKpi::getKpiTotalScore)
                            .filter(score -> score != null)
                            .findFirst()
                            .orElse(null);
                    if (savedTotal != null) {
                        return savedTotal;
                    }
                    List<BigDecimal> weightedScores = kpis.stream()
                            .map(EmployeeKpi::getWeightedScore)
                            .filter(score -> score != null)
                            .toList();
                    if (weightedScores.isEmpty()) {
                        return BigDecimal.ZERO;
                    }
                    return weightedScores.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
                })
                .orElse(null);
    }

    private void attachKpiScore(Pip pip) {
        if (pip != null && pip.getKpiScore() == null) {
            pip.setKpiScore(getLatestKpiTotalScore(pip.getEmployee()));
        }
    }

    private String normalizeStatus(String status) {
        return status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
    }

    private record EligibleEmployeeWithScore(Employee employee, BigDecimal totalScore) {
    }
}
