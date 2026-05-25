package com.epms.backend.service;

import com.epms.backend.StaffTypes;
import com.epms.backend.audit.AuditActionType;
import com.epms.backend.audit.AuditTargetType;
import com.epms.backend.dto.selfassessmentform.*;
import com.epms.backend.entity.*;
import com.epms.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class SelfAssessmentFormService {

    /** Forms visible on HR / manager history (completed or missed submission only). */
    private static final EnumSet<SelfAssessmentFormStatus> SCORE_RECORD_HISTORY_STATUSES = EnumSet.of(
            SelfAssessmentFormStatus.FINALIZED_LOCKED,
            SelfAssessmentFormStatus.NOT_SUBMITTED);

    /** Forms visible on HR / manager review queue (in workflow). */
    private static final EnumSet<SelfAssessmentFormStatus> REVIEW_QUEUE_VISIBLE_STATUSES = EnumSet.of(
            SelfAssessmentFormStatus.SUBMITTED,
            SelfAssessmentFormStatus.APPROVED,
            SelfAssessmentFormStatus.REOPENED,
            SelfAssessmentFormStatus.PENDING_MANAGER_REVIEW,
            SelfAssessmentFormStatus.PENDING_EMPLOYEE_REVIEW,
            SelfAssessmentFormStatus.PENDING_EMPLOYEE_RETAKE,
            SelfAssessmentFormStatus.PENDING_RETAKE_MANAGER_REVIEW,
            SelfAssessmentFormStatus.PENDING_FINAL_APPROVAL,
            SelfAssessmentFormStatus.PENDING_HR_CALIBRATION_REVIEW,
            SelfAssessmentFormStatus.MANAGER_REVIEWED);

    private static final DateTimeFormatter NOTIFICATION_DEADLINE_FORMAT =
            DateTimeFormatter.ofPattern("dd-MM-yyyy");

    private final SelfAssessmentFormTemplateRepository templateRepository;
    private final CopiedSelfAssessmentFormTemplateRepository copiedTemplateRepository;
    private final SelfAssessmentFormRepository formRepository;
    private final SelfAssessmentFormAdjustmentRepository adjustmentRepository;
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final SignatureRepository signatureRepository;
    private final ReviewCycleService reviewCycleService;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final SelfAssessmentSettingsRepository settingsRepository;
    private final ReportingManagerResolver reportingManagerResolver;
    private final SelfAssessmentUnlockRequestRepository unlockRequestRepository;

    public SelfAssessmentFormService(
            SelfAssessmentFormTemplateRepository templateRepository,
            CopiedSelfAssessmentFormTemplateRepository copiedTemplateRepository,
            SelfAssessmentFormRepository formRepository,
            SelfAssessmentFormAdjustmentRepository adjustmentRepository,
            EmployeeRepository employeeRepository,
            DepartmentRepository departmentRepository,
            PositionRepository positionRepository,
            SignatureRepository signatureRepository,
            ReviewCycleService reviewCycleService,
            NotificationService notificationService,
            AuditService auditService,
            AuditLogRepository auditLogRepository,
            UserRepository userRepository,
            NotificationRepository notificationRepository,
            SelfAssessmentSettingsRepository settingsRepository,
            ReportingManagerResolver reportingManagerResolver,
            SelfAssessmentUnlockRequestRepository unlockRequestRepository) {
        this.templateRepository = templateRepository;
        this.copiedTemplateRepository = copiedTemplateRepository;
        this.formRepository = formRepository;
        this.adjustmentRepository = adjustmentRepository;
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.positionRepository = positionRepository;
        this.signatureRepository = signatureRepository;
        this.reviewCycleService = reviewCycleService;
        this.notificationService = notificationService;
        this.auditService = auditService;
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.settingsRepository = settingsRepository;
        this.reportingManagerResolver = reportingManagerResolver;
        this.unlockRequestRepository = unlockRequestRepository;
    }

    @Transactional
    public SelfAssessmentFormTemplateDto createTemplate(CreateTemplateRequest request, Long userId) {
        boolean manualTimeline = isManualTimeline(request.timelineMode());
        LocalDate manualStartDate = null;
        LocalDate manualEndDate = null;
        ReviewCycle cycle = null;
        if (manualTimeline) {
            validateManualTemplateDates(request.manualStartDate(), request.manualEndDate());
            manualStartDate = request.manualStartDate();
            manualEndDate = request.manualEndDate();
        } else {
            cycle = reviewCycleService.resolveCycleForSelfAssessmentTemplate(request.reviewCycleId());
        }
        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new RuntimeException("Department not found"));
        Position position = positionRepository.findById(request.positionId())
                .orElseThrow(() -> new RuntimeException("Position not found"));

        Optional<SelfAssessmentFormTemplate> existing = manualTimeline
                ? templateRepository.findActiveManualByDepartmentAndPositionAndDateRange(
                        request.departmentId(), request.positionId(), manualStartDate, manualEndDate)
                : templateRepository.findActiveByDepartmentAndPositionAndReviewCycleId(
                        request.departmentId(), request.positionId(), cycle.getId());
        if (existing.isPresent()) {
            throw new RuntimeException(manualTimeline
                    ? "An active manual template already exists for this department, position, and date range"
                    : "An active template already exists for this department, position, and review cycle");
        }

        SelfAssessmentFormTemplate template = new SelfAssessmentFormTemplate();
        template.setTitle(request.title().trim());
        template.setDepartment(department);
        template.setPosition(position);
        template.setReviewCycle(cycle);
        template.setManualStartDate(manualStartDate);
        template.setManualEndDate(manualEndDate);
        template.setRatingSystem(resolveTemplateRatingSystem(request.ratingSystem()));
        template.setTenPointYesMinRating(resolveTemplateTenPointYesMinRating(request.tenPointYesMinRating()));
        template.setActive(true);
        template.setCreatedBy(userId);
        template.setCreatedOn(Instant.now());

        SelfAssessmentFormTemplate saved = templateRepository.saveAndFlush(template);

        Instant now = Instant.now();
        for (int i = 0; i < request.questions().size(); i++) {
            QuestionRequest qr = request.questions().get(i);
            SelfAssessmentFormTemplateQuestion question = new SelfAssessmentFormTemplateQuestion();
            question.setQuestionText(qr.questionText().trim());
            question.setSortOrder(i);
            question.setCreatedBy(userId);
            question.setCreatedOn(now);
            saved.addQuestion(question);
        }
        if (request.deletedQuestions() != null) {
            for (int i = 0; i < request.deletedQuestions().size(); i++) {
                QuestionRequest qr = request.deletedQuestions().get(i);
                if (qr.questionText() == null || qr.questionText().trim().isBlank()) {
                    continue;
                }
                SelfAssessmentFormTemplateQuestion question = new SelfAssessmentFormTemplateQuestion();
                question.setQuestionText(qr.questionText().trim());
                question.setSortOrder(qr.sortOrder() != null ? qr.sortOrder() : request.questions().size() + i);
                question.setCreatedBy(userId);
                question.setCreatedOn(now);
                question.setDeletedAt(now);
                question.setDeletedBy(userId);
                saved.addQuestion(question);
            }
        }
        templateRepository.save(saved);

        auditService.record(
                AuditActionType.SELF_ASSESSMENT_FORM_TEMPLATE_CREATED,
                AuditTargetType.SELF_ASSESSMENT_FORM_TEMPLATE,
                saved.getId(),
                userId,
                null,
                "Created self-assessment form template for department " + department.getName() + " and position " + position.getName(),
                null);

        return toTemplateDto(saved);
    }

    @Transactional
    public CopiedSelfAssessmentFormTemplateDto copyTemplate(Long templateId, Long userId) {
        SelfAssessmentFormTemplate source = templateRepository.findById(templateId)
                .orElseThrow(() -> new RuntimeException("Template not found"));

        copiedTemplateRepository.findByCreatedBy(userId).ifPresent(existing -> {
            copiedTemplateRepository.delete(existing);
            copiedTemplateRepository.flush();
        });

Instant now = Instant.now();
        CopiedSelfAssessmentFormTemplate copied = new CopiedSelfAssessmentFormTemplate();
        copied.setSourceTemplate(source);
        copied.setTitle(source.getTitle());
        copied.setRatingSystem(SelfAssessmentRatingSystem.defaultIfNull(source.getRatingSystem()));
        copied.setTenPointYesMinRating(resolveSavedTenPointYesMinRating(source.getTenPointYesMinRating()));
        copied.setCreatedBy(userId);
        copied.setCreatedOn(now);
        copied.setDepartmentId(source.getDepartment().getId());
        copied.setPositionId(source.getPosition().getId());

        source.getQuestions().stream()
                .sorted(Comparator
                        .comparing((SelfAssessmentFormTemplateQuestion q) -> q.getDeletedAt() == null ? 0 : 1)
                        .thenComparing(SelfAssessmentFormTemplateQuestion::getSortOrder))
                .forEach(sourceQuestion -> {
                    CopiedSelfAssessmentFormTemplateQuestion question = new CopiedSelfAssessmentFormTemplateQuestion();
                    question.setQuestionText(sourceQuestion.getQuestionText());
                    question.setSortOrder(sourceQuestion.getSortOrder());
                    question.setCreatedBy(sourceQuestion.getCreatedBy());
                    question.setCreatedOn(sourceQuestion.getCreatedOn());
                    question.setDeletedAt(sourceQuestion.getDeletedAt());
                    question.setDeletedBy(sourceQuestion.getDeletedBy());
                    copied.addQuestion(question);
                });

        return toCopiedTemplateDto(copiedTemplateRepository.save(copied));
    }

    @Transactional(readOnly = true)
    public Optional<CopiedSelfAssessmentFormTemplateDto> getCopiedTemplate(Long userId) {
        return copiedTemplateRepository.findByCreatedBy(userId).map(this::toCopiedTemplateDto);
    }

    @Transactional
    public void deleteCopiedTemplate(Long userId) {
        copiedTemplateRepository.deleteByCreatedBy(userId);
    }

    @Transactional(readOnly = true)
    public List<TemplateActiveCheckResultDto> findActiveTemplateConflicts(TemplateActiveCheckRequest request) {
        return request.targets().stream()
                .map(target -> templateRepository.findActiveByDepartmentAndPositionAndReviewCycleId(
                        target.departmentId(), target.positionId(), request.reviewCycleId()))
                .flatMap(Optional::stream)
                .map(template -> new TemplateActiveCheckResultDto(
                        template.getDepartment().getId(),
                        template.getPosition().getId(),
                        template.getId(),
                        template.getTitle(),
                        template.getDepartment().getName(),
                        template.getPosition().getName(),
                        template.getReviewCycle() != null ? template.getReviewCycle().getId() : null,
                        template.getReviewCycle() != null ? template.getReviewCycle().getName() : null))
                .collect(Collectors.toList());
    }

    @Transactional
    public SelfAssessmentFormTemplateDto updateTemplate(Long id, UpdateTemplateRequest request, Long userId) {
        SelfAssessmentFormTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found"));
        assertTemplateEditable(template);

        Long rcId = template.getReviewCycle() != null ? template.getReviewCycle().getId() : null;
        boolean manualTimeline = isManualTemplate(template);
        Optional<SelfAssessmentFormTemplate> existing = rcId != null
                ? templateRepository.findActiveByDepartmentAndPositionAndReviewCycleIdExcluding(
                        request.departmentId(), request.positionId(), rcId, id)
                : manualTimeline
                        ? templateRepository.findActiveManualByDepartmentAndPositionAndDateRangeExcluding(
                                request.departmentId(),
                                request.positionId(),
                                template.getManualStartDate(),
                                template.getManualEndDate(),
                                id)
                        : templateRepository.findActiveByDepartmentAndPositionWithNullReviewCycleExcluding(
                                request.departmentId(), request.positionId(), id);
        if (existing.isPresent() && request.isActive()) {
            throw new RuntimeException(manualTimeline
                    ? "An active manual template already exists for this department, position, and date range"
                    : "An active template already exists for this department, position, and review cycle");
        }

        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new RuntimeException("Department not found"));
        Position position = positionRepository.findById(request.positionId())
                .orElseThrow(() -> new RuntimeException("Position not found"));

        template.setTitle(request.title().trim());
        template.setDepartment(department);
        template.setPosition(position);
        if (request.ratingSystem() != null && !request.ratingSystem().trim().isBlank()) {
            template.setRatingSystem(parseRatingSystem(request.ratingSystem()));
        }
        if (request.tenPointYesMinRating() != null) {
            template.setTenPointYesMinRating(parseTenPointYesMinRating(request.tenPointYesMinRating()));
        }
        template.setActive(request.isActive());
        template.setUpdatedBy(userId);
        template.setUpdatedOn(Instant.now());

        Set<Long> incomingIds = new HashSet<>();
        for (QuestionRequest qr : request.questions()) {
            if (qr.id() != null && !incomingIds.add(qr.id())) {
                throw new RuntimeException("Duplicate question id in request");
            }
        }

        Instant now = Instant.now();
        Map<Long, SelfAssessmentFormTemplateQuestion> existingById = new HashMap<>();
        for (SelfAssessmentFormTemplateQuestion q : template.getQuestions()) {
            existingById.put(q.getId(), q);
        }

        int sortIndex = 0;
        for (QuestionRequest qr : request.questions()) {
            if (qr.id() != null) {
                SelfAssessmentFormTemplateQuestion q = existingById.get(qr.id());
                if (q == null) {
                    throw new RuntimeException("Question not found: " + qr.id());
                }
                if (!q.getTemplate().getId().equals(template.getId())) {
                    throw new RuntimeException("Question does not belong to this template");
                }
                q.setQuestionText(qr.questionText().trim());
                q.setSortOrder(sortIndex++);
                q.setDeletedAt(null);
                q.setDeletedBy(null);
            } else {
                SelfAssessmentFormTemplateQuestion question = new SelfAssessmentFormTemplateQuestion();
                question.setQuestionText(qr.questionText().trim());
                question.setSortOrder(sortIndex++);
                question.setCreatedBy(userId);
                question.setCreatedOn(now);
                template.addQuestion(question);
            }
        }

        for (SelfAssessmentFormTemplateQuestion q : new ArrayList<>(template.getQuestions())) {
            if (q.getId() != null && !incomingIds.contains(q.getId()) && q.getDeletedAt() == null) {
                q.setDeletedAt(now);
                q.setDeletedBy(userId);
            }
        }

        SelfAssessmentFormTemplate saved = templateRepository.save(template);

        auditService.record(
                AuditActionType.SELF_ASSESSMENT_FORM_TEMPLATE_UPDATED,
                AuditTargetType.SELF_ASSESSMENT_FORM_TEMPLATE,
                saved.getId(),
                userId,
                null,
                "Updated self-assessment form template",
                null);

        return toTemplateDto(saved);
    }

    @Transactional
    public SelfAssessmentFormTemplateDto updateTemplateForRole(
            Long id,
            UpdateTemplateRequest request,
            Long userId,
            Long roleId,
            Employee employee) {
        if (roleId != null && roleId == 1L) {
            return updateTemplate(id, request, userId);
        }
        if (roleId != null && roleId == 2L) {
            return updateTemplateAsManager(id, request, userId, employee);
        }
        throw new RuntimeException("Unauthorized");
    }

    @Transactional
    public SelfAssessmentFormTemplateDto updateTemplateAsManager(
            Long id,
            UpdateTemplateRequest request,
            Long userId,
            Employee manager) {
        SelfAssessmentFormTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found"));
        requireManagerTemplateAccess(template, manager);
        assertTemplateEditable(template);

        Set<Long> incomingIds = new HashSet<>();
        for (QuestionRequest qr : request.questions()) {
            if (qr.id() != null && !incomingIds.add(qr.id())) {
                throw new RuntimeException("Duplicate question id in request");
            }
        }

        Map<Long, SelfAssessmentFormTemplateQuestion> existingById = new HashMap<>();
        for (SelfAssessmentFormTemplateQuestion q : template.getQuestions()) {
            if (q.getId() != null) {
                existingById.put(q.getId(), q);
            }
        }

        for (SelfAssessmentFormTemplateQuestion q : template.getQuestions()) {
            if (q.getId() == null || q.getCreatedBy() == null || q.getCreatedBy().equals(userId)) {
                continue;
            }
            boolean isActiveOtherQuestion = q.getDeletedAt() == null;
            boolean isIncoming = incomingIds.contains(q.getId());
            if (isActiveOtherQuestion && !isIncoming) {
                throw new RuntimeException("Managers cannot remove questions created by HR or other users");
            }
        }

        Instant now = Instant.now();
        List<QuestionRequest> managerRows = new ArrayList<>();

        for (QuestionRequest qr : request.questions()) {
            if (qr.id() == null) {
                managerRows.add(qr);
                continue;
            }

            SelfAssessmentFormTemplateQuestion q = existingById.get(qr.id());
            if (q == null) {
                throw new RuntimeException("Question not found: " + qr.id());
            }
            if (!q.getTemplate().getId().equals(template.getId())) {
                throw new RuntimeException("Question does not belong to this template");
            }
            if (userId.equals(q.getCreatedBy())) {
                managerRows.add(qr);
                continue;
            }
            if (q.getDeletedAt() != null) {
                throw new RuntimeException("Managers cannot restore questions created by HR or other users");
            }
            if (!q.getQuestionText().trim().equals(qr.questionText().trim())) {
                throw new RuntimeException("Managers cannot edit questions created by HR or other users");
            }
        }

        int nextSortOrder = template.getQuestions().stream()
                .filter(q -> q.getDeletedAt() == null)
                .filter(q -> !userId.equals(q.getCreatedBy()))
                .map(SelfAssessmentFormTemplateQuestion::getSortOrder)
                .max(Integer::compareTo)
                .orElse(-1) + 1;

        Set<Long> activeManagerIds = new HashSet<>();
        for (QuestionRequest qr : managerRows) {
            String text = qr.questionText() == null ? "" : qr.questionText().trim();
            if (text.isBlank()) {
                continue;
            }
            if (qr.id() != null) {
                SelfAssessmentFormTemplateQuestion q = existingById.get(qr.id());
                if (!userId.equals(q.getCreatedBy())) {
                    throw new RuntimeException("Managers can only update questions they added");
                }
                q.setQuestionText(text);
                q.setSortOrder(nextSortOrder++);
                q.setDeletedAt(null);
                q.setDeletedBy(null);
                activeManagerIds.add(q.getId());
            } else {
                SelfAssessmentFormTemplateQuestion question = new SelfAssessmentFormTemplateQuestion();
                question.setQuestionText(text);
                question.setSortOrder(nextSortOrder++);
                question.setCreatedBy(userId);
                question.setCreatedOn(now);
                template.addQuestion(question);
            }
        }

        for (SelfAssessmentFormTemplateQuestion q : template.getQuestions()) {
            if (q.getId() != null
                    && userId.equals(q.getCreatedBy())
                    && q.getDeletedAt() == null
                    && !activeManagerIds.contains(q.getId())) {
                q.setDeletedAt(now);
                q.setDeletedBy(userId);
            }
        }

        template.setUpdatedBy(userId);
        template.setUpdatedOn(now);
        SelfAssessmentFormTemplate saved = templateRepository.save(template);

        auditService.record(
                AuditActionType.SELF_ASSESSMENT_FORM_TEMPLATE_UPDATED,
                AuditTargetType.SELF_ASSESSMENT_FORM_TEMPLATE,
                saved.getId(),
                userId,
                null,
                "Updated manager-added self-assessment template questions",
                null);

        return toTemplateDto(saved, userId, 2L);
    }

    @Transactional(readOnly = true)
    public List<SelfAssessmentFormTemplateDto> getAllTemplates() {
        return templateRepository.findAll().stream()
                .map(this::toTemplateDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SelfAssessmentFormTemplateDto> getAllTemplatesForRole(Long userId, Long roleId, Employee employee) {
        if (roleId != null && roleId == 1L) {
            return templateRepository.findAll().stream()
                    .map(template -> toTemplateDto(template, userId, roleId))
                    .collect(Collectors.toList());
        }
        if (roleId != null && roleId == 2L) {
            Long departmentId = getEmployeeDepartmentId(employee);
            if (departmentId == null) {
                throw new RuntimeException("Manager department not found");
            }
            return templateRepository.findAll().stream()
                    .filter(SelfAssessmentFormTemplate::isActive)
                    .filter(template -> template.getDepartment() != null
                            && departmentId.equals(template.getDepartment().getId()))
                    .filter(this::isHrCreatedTemplate)
                    .map(template -> toTemplateDto(template, userId, roleId))
                    .collect(Collectors.toList());
        }
        throw new RuntimeException("Unauthorized");
    }

    @Transactional(readOnly = true)
    public SelfAssessmentFormTemplateDto getTemplateById(Long id) {
        SelfAssessmentFormTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found"));
        return toTemplateDto(template);
    }

    @Transactional(readOnly = true)
    public SelfAssessmentFormTemplateDto getTemplateByIdForRole(Long id, Long userId, Long roleId, Employee employee) {
        SelfAssessmentFormTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found"));
        if (roleId != null && roleId == 1L) {
            return toTemplateDto(template, userId, roleId);
        }
        if (roleId != null && roleId == 2L) {
            requireManagerTemplateAccess(template, employee);
            return toTemplateDto(template, userId, roleId);
        }
        throw new RuntimeException("Unauthorized");
    }

    @Transactional(readOnly = true)
    public Optional<SelfAssessmentFormTemplateDto> getActiveTemplate(Long departmentId, Long positionId) {
        ReviewCycle cycle = reviewCycleService.getActiveSubmissionCycle();
        if (cycle == null) {
            return Optional.empty();
        }
        return findActiveTemplateForDepartmentPositionAndCycle(departmentId, positionId, cycle).map(this::toTemplateDto);
    }

    @Transactional
    public SetTemplateDeadlineResponse setTemplateDeadline(Long templateId, SetTemplateDeadlineRequest request, Long userId) {
        SelfAssessmentFormTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new RuntimeException("Template not found"));
        if (!template.isActive()) {
            throw new RuntimeException("Template is inactive");
        }

        ReviewCycle activeCycle = requireActiveCycle();
        if (template.getReviewCycle() != null
                && !template.getReviewCycle().getId().equals(activeCycle.getId())) {
            throw new RuntimeException(
                    "This template belongs to a different review cycle than the active submission cycle. Use a template created for the current cycle.");
        }
        validateAssignmentDeadlines(
                request.startDate(),
                request.deadlineDate(),
                request.managerReviewDeadlineDate(),
                activeCycle);

        List<Employee> employees = employeeRepository.findEligibleSelfAssessmentAssignees(
                template.getDepartment().getId(),
                template.getPosition().getId(),
                EmployeeStatus.ACTIVE,
                StaffTypes.PERMANENT);

        int created = 0;
        int skipped = 0;
        Instant now = Instant.now();
        for (Employee employee : employees) {
            if (formRepository.existsByEmployeeAndCycle(employee, activeCycle)) {
                skipped++;
                continue;
            }

            SelfAssessmentForm form = createAssignedDraftForm(
                    employee,
                    template,
                    activeCycle,
                    request.startDate(),
                    request.deadlineDate(),
                    request.managerReviewDeadlineDate(),
                    now,
                    userId);
            formRepository.save(form);
            created++;

            notificationService.send(
                    employee.getUserAccount(),
                    "Self-Assessment Assigned",
                    "A self-assessment form has been assigned to you. Deadline: "
                            + request.deadlineDate().format(NOTIFICATION_DEADLINE_FORMAT),
                    "SELF_ASSESSMENT_FORM");

            Employee manager = reportingManagerResolver.resolve(employee);
            if (manager != null && manager.getUserAccount() != null) {
                notificationService.send(
                        manager.getUserAccount(),
                        "New Self-Assessment Pending Your Review",
                        "Employee " + employee.getEmployeeName() + " has a self-assessment form assigned. "
                                + "Start Date: " + request.startDate().format(NOTIFICATION_DEADLINE_FORMAT)
                                + ". Manager Review Deadline: " + request.managerReviewDeadlineDate().format(NOTIFICATION_DEADLINE_FORMAT),
                        "SELF_ASSESSMENT_FORM");
            }
        }

        auditService.record(
                AuditActionType.SELF_ASSESSMENT_FORM_TEMPLATE_UPDATED,
                AuditTargetType.SELF_ASSESSMENT_FORM_TEMPLATE,
                template.getId(),
                userId,
                null,
                "Set self-assessment deadlines (start "
                        + request.startDate()
                        + ", employee "
                        + request.deadlineDate()
                        + ", manager "
                        + request.managerReviewDeadlineDate()
                        + ") and assigned "
                        + created
                        + " forms; skipped "
                        + skipped,
                null);

        return new SetTemplateDeadlineResponse(
                template.getId(),
                template.getTitle(),
                template.getDepartment().getId(),
                template.getDepartment().getName(),
                template.getPosition().getId(),
                template.getPosition().getName(),
                template.getTitle(),
                request.deadlineDate(),
                toCycleInfo(activeCycle),
                created,
                skipped);
    }

    @Transactional
    public SelfAssessmentAssignmentResponse assignSelfAssessmentForms(SelfAssessmentAssignmentRequest request, Long userId) {
        AssignmentMode assignmentMode = parseAssignmentMode(request.assignmentMode());
        validateAssignmentSelections(assignmentMode, request.departmentIds(), request.positionIds(), request.employeeIds());

        boolean manualTimeline = isManualTimeline(request.timelineMode());
        ReviewCycle activeCycle = manualTimeline ? null : requireActiveCycle();
        if (manualTimeline) {
            validateManualAssignmentTimeline(request);
        } else {
            validateAssignmentDeadlines(
                    request.startDate(),
                    request.deadlineDate(),
                    request.managerReviewDeadlineDate(),
                    activeCycle);
        }

        Set<Long> departmentIds = toIdSet(request.departmentIds());
        Set<Long> positionIds = toIdSet(request.positionIds());
        Set<Long> employeeIdSet = toIdSet(request.employeeIds());
        List<Employee> candidates = employeeRepository.findEligibleSelfAssessmentAssignees(
                EmployeeStatus.ACTIVE,
                StaffTypes.PROBATION);

        int created = 0;
        int skippedExisting = 0;
        int skippedNoTemplate = 0;
        int skippedIneligible = 0;
        Instant now = Instant.now();

        for (Employee employee : candidates) {
            if (!matchesAssignmentMode(employee, assignmentMode, departmentIds, positionIds, employeeIdSet)) {
                continue;
            }
            if (!manualTimeline && formRepository.existsByEmployeeAndCycle(employee, activeCycle)) {
                skippedExisting++;
                continue;
            }
            Long departmentId = getEmployeeDepartmentId(employee);
            Long positionId = getEmployeePositionId(employee);
            if (departmentId == null || positionId == null) {
                skippedNoTemplate++;
                continue;
            }

            Optional<SelfAssessmentFormTemplate> templateOpt = manualTimeline
                    ? templateRepository.findActiveManualByDepartmentAndPositionAndDateRange(
                            departmentId,
                            positionId,
                            request.manualStartDate(),
                            request.manualEndDate())
                    : templateRepository.findActiveByDepartmentAndPositionAndReviewCycleId(
                            departmentId,
                            positionId,
                            activeCycle.getId());
            if (templateOpt.isEmpty()) {
                skippedNoTemplate++;
                continue;
            }
            SelfAssessmentFormTemplate template = templateOpt.get();

            if (manualTimeline && formRepository.existsByEmployeeAndTemplateAndStartDateAndDeadlineDateAndManagerReviewDeadlineDate(
                    employee,
                    template,
                    request.startDate(),
                    request.deadlineDate(),
                    request.managerReviewDeadlineDate())) {
                skippedExisting++;
                continue;
            }

            SelfAssessmentForm form = createAssignedDraftForm(
                    employee,
                    template,
                    activeCycle,
                    request.startDate(),
                    request.deadlineDate(),
                    request.managerReviewDeadlineDate(),
                    now,
                    userId);
            formRepository.save(form);
            created++;

            notificationService.send(
                    employee.getUserAccount(),
                    "Self-Assessment Assigned",
                    "A self-assessment form has been assigned to you. Deadline: "
                            + request.deadlineDate().format(NOTIFICATION_DEADLINE_FORMAT),
                    "SELF_ASSESSMENT_FORM");

            Employee manager = reportingManagerResolver.resolve(employee);
            if (manager != null && manager.getUserAccount() != null) {
                notificationService.send(
                        manager.getUserAccount(),
                        "New Self-Assessment Pending Your Review",
                        "Employee " + employee.getEmployeeName() + " has a self-assessment form assigned. "
                                + "Start Date: " + request.startDate().format(NOTIFICATION_DEADLINE_FORMAT)
                                + ". Manager Review Deadline: " + request.managerReviewDeadlineDate().format(NOTIFICATION_DEADLINE_FORMAT),
                        "SELF_ASSESSMENT_FORM");
            }
        }

        if (assignmentMode == AssignmentMode.SPECIFIC_EMPLOYEES) {
            for (Long requestedId : employeeIdSet) {
                boolean matched = candidates.stream().anyMatch(e -> requestedId.equals(e.getId()));
                if (!matched) {
                    skippedIneligible++;
                }
            }
        }

        auditService.record(
                AuditActionType.SELF_ASSESSMENT_FORM_TEMPLATE_UPDATED,
                AuditTargetType.SELF_ASSESSMENT_FORM,
                null,
                userId,
                null,
                "Bulk assigned self-assessment forms: created " + created
                        + ", skipped existing " + skippedExisting
                        + ", skipped no template " + skippedNoTemplate
                        + ", skipped ineligible " + skippedIneligible,
                null);

        return new SelfAssessmentAssignmentResponse(
                created,
                skippedExisting,
                skippedNoTemplate,
                skippedIneligible,
                activeCycle != null ? toCycleInfo(activeCycle) : null);
    }

    @Transactional(readOnly = true)
    public List<SelfAssessmentAssignmentPreviewDto> previewSelfAssessmentAssignments(
            SelfAssessmentAssignmentPreviewRequest request) {
        boolean manualTimeline = isManualTimeline(request.timelineMode());
        ReviewCycle activeCycle = manualTimeline ? null : requireActiveCycle();
        if (manualTimeline) {
            validateManualPreviewTimeline(request);
        } else {
            validateAssignmentDeadlines(
                    request.deadlineDate(),
                    request.deadlineDate(),
                    request.managerReviewDeadlineDate(),
                    activeCycle);
        }

        return request.targets().stream()
                .map(target -> previewSelfAssessmentAssignmentTarget(target, request, activeCycle, manualTimeline))
                .collect(Collectors.toList());
    }

    private SelfAssessmentAssignmentPreviewDto previewSelfAssessmentAssignmentTarget(
            TemplateTargetPairRequest target,
            SelfAssessmentAssignmentPreviewRequest request,
            ReviewCycle activeCycle,
            boolean manualTimeline) {
        Department department = departmentRepository.findById(target.departmentId())
                .orElseThrow(() -> new RuntimeException("Department not found"));
        Position position = positionRepository.findById(target.positionId())
                .orElseThrow(() -> new RuntimeException("Position not found"));

        Optional<SelfAssessmentFormTemplate> templateOpt = manualTimeline
                ? templateRepository.findActiveManualByDepartmentAndPositionAndDateRange(
                        target.departmentId(),
                        target.positionId(),
                        request.manualStartDate(),
                        request.manualEndDate())
                : templateRepository.findActiveByDepartmentAndPositionAndReviewCycleId(
                        target.departmentId(),
                        target.positionId(),
                        activeCycle.getId());

        if (templateOpt.isEmpty()) {
            return new SelfAssessmentAssignmentPreviewDto(
                    department.getId(),
                    department.getName(),
                    position.getId(),
                    position.getName(),
                    null,
                    null,
                    null,
                    0,
                    "NO_TEMPLATE",
                    0);
        }

        SelfAssessmentFormTemplate template = templateOpt.get();
        long assignedCount = manualTimeline
                ? formRepository.countByTemplateAndCycleIsNullAndStartDateAndDeadlineDateAndManagerReviewDeadlineDate(
                        template,
                        request.manualStartDate(),
                        request.deadlineDate(),
                        request.managerReviewDeadlineDate())
                : formRepository.countByTemplateAndCycleAndDeadlineDateAndManagerReviewDeadlineDate(
                        template,
                        activeCycle,
                        request.deadlineDate(),
                        request.managerReviewDeadlineDate());
        int questionCount = (int) template.getQuestions().stream()
                .filter(question -> question.getDeletedAt() == null)
                .count();

        return new SelfAssessmentAssignmentPreviewDto(
                department.getId(),
                department.getName(),
                position.getId(),
                position.getName(),
                template.getId(),
                template.getTitle(),
                SelfAssessmentRatingSystem.defaultIfNull(template.getRatingSystem()).name(),
                questionCount,
                assignedCount > 0 ? "ALREADY_ASSIGNED" : "NOT_ASSIGNED",
                assignedCount);
    }

    @Transactional
    public FormStatusDto getEmployeeFormStatus(Employee employee) {
        if (!isPermanentEmployee(employee)) {
            return new FormStatusDto(null, false, false, false, "You are not eligible for self-assessment. Only permanent employees can participate.");
        }

        ReviewCycle activeCycle = getActiveCycle();
        if (activeCycle == null) {
            return new FormStatusDto(null, true, false, false, "No active cycle found in system settings.");
        }

        Optional<SelfAssessmentForm> existingForm = formRepository.findByEmployeeAndCycle(employee, activeCycle);
        if (existingForm.isPresent()) {
            SelfAssessmentForm form = existingForm.get();
            if (isAssignmentScheduledForFuture(form)) {
                return new FormStatusDto("NOT_ASSIGNED", true, true, false, "Your self-assessment starts on " + form.getStartDate() + ".");
            }
            boolean normalized = normalizeOverdueDraftForm(form);
            boolean deadlinePassed = isDeadlinePassed(form);
            if (normalized) {
                return new FormStatusDto("NOT_SUBMITTED", true, true, true, "Deadline has passed. Your draft was marked as not submitted.");
            }
            return new FormStatusDto(form.getStatus().name(), true, true, deadlinePassed, null);
        }

        DepartmentPosition dp = employee.getDepartmentPosition();
        if (dp == null) {
            return new FormStatusDto(null, true, false, false, "No department-position mapping found for you.");
        }

        Optional<SelfAssessmentFormTemplate> templateOpt = findActiveTemplateForDepartmentPositionAndCycle(
                dp.getDepartment().getId(), dp.getPosition().getId(), activeCycle);

        if (templateOpt.isEmpty()) {
            return new FormStatusDto(null, true, false, false, "No active self-assessment Form available for your department and position.");
        }

        return new FormStatusDto("NOT_ASSIGNED", true, true, false, "No self-assessment form has been assigned to you for the active cycle.");
    }

    @Transactional
    public Optional<SelfAssessmentFormDto> getEmployeeCurrentForm(Employee employee) {
        ReviewCycle activeCycle = getActiveCycle();
        if (activeCycle == null) {
            throw new RuntimeException("No active cycle found");
        }

        Optional<SelfAssessmentForm> existingForm = formRepository.findByEmployeeAndCycle(employee, activeCycle);

        if (existingForm.isPresent()) {
            if (isAssignmentScheduledForFuture(existingForm.get())) {
                return Optional.empty();
            }
            normalizeOverdueDraftForm(existingForm.get());
            return Optional.of(toFormDto(existingForm.get()));
        }

        return Optional.empty();
    }

    @Transactional
    public SelfAssessmentFormDto saveDraft(Employee employee, SaveDraftRequest request) {
        SelfAssessmentForm form = getOrCreateForm(employee);

        if (form.getStatus() != SelfAssessmentFormStatus.DRAFT && form.getStatus() != SelfAssessmentFormStatus.REOPENED) {
            throw new RuntimeException("Form cannot be edited in current status: " + form.getStatus());
        }

        if (isDeadlinePassed(form)) {
            throw new RuntimeException("Deadline has passed. Cannot save draft.");
        }

        updateAnswers(form, request.answers());
        form.setEmployeeRemarks(request.employeeRemarks());
        form.setOverallRemarks(request.overallRemarks());
        form.setUpdatedDate(Instant.now());

        SelfAssessmentForm saved = formRepository.save(form);

        auditService.record(
                AuditActionType.SELF_ASSESSMENT_FORM_DRAFT_SAVED,
                AuditTargetType.SELF_ASSESSMENT_FORM,
                saved.getId(),
                employee.getUserAccount().getId(),
                null,
                "Saved draft for self-assessment form",
                null);

        return toFormDto(saved);
    }

    @Transactional
    public SelfAssessmentFormDto submitForm(Employee employee, SubmitFormRequest request) {
        SelfAssessmentForm form = getOrCreateForm(employee);

        if (form.getStatus() != SelfAssessmentFormStatus.DRAFT && form.getStatus() != SelfAssessmentFormStatus.REOPENED) {
            throw new RuntimeException("Form cannot be submitted in current status: " + form.getStatus());
        }

        if (isDeadlinePassed(form)) {
            throw new RuntimeException("Deadline has passed. Cannot submit.");
        }

        if (formRepository.existsByEmployeeAndCycle(employee, form.getCycle())) {
            List<SelfAssessmentForm> existingForms = formRepository.findByEmployee(employee);
            boolean alreadySubmitted = existingForms.stream()
                    .anyMatch(f -> !Objects.equals(f.getId(), form.getId())
                            && f.getCycle().equals(form.getCycle())
                            && isPostSubmitStatus(f.getStatus()));
            if (alreadySubmitted) {
                throw new RuntimeException("You have already submitted your self-assessment for this cycle.");
            }
        }

        updateAnswers(form, request.answers());
        form.setEmployeeRemarks(request.employeeRemarks());
        form.setOverallRemarks(request.overallRemarks());
        boolean submittingReopenedForm = form.getStatus() == SelfAssessmentFormStatus.REOPENED;

        Signature defaultSig = signatureRepository.findByUserAndIsDefaultTrue(employee.getUserAccount())
                .orElseThrow(() -> new RuntimeException("No default signature found. Please set up your signature before submitting."));

        form.setEmployeeSignatureId(defaultSig.getId());
        form.setEmployeeSignatureDate(Instant.now());
        boolean managerOwnedForm = isManagerOwnedForm(form);
        if (managerOwnedForm) {
            form.setStatus(SelfAssessmentFormStatus.PENDING_FINAL_APPROVAL);
        } else {
            form.setStatus(SelfAssessmentFormStatus.PENDING_MANAGER_REVIEW);
        }
        Instant submittedAt = Instant.now();
        form.setSubmittedDate(submittedAt);
        form.setAssessmentDate(LocalDate.ofInstant(submittedAt, ZoneId.systemDefault()));
        form.setUpdatedDate(submittedAt);

        calculateScore(form);

        SelfAssessmentForm saved = formRepository.save(form);

        boolean resubmittedAfterUnlock = submittingReopenedForm && hasResolvedUnlockRequest(form);

        auditService.record(
                resubmittedAfterUnlock
                        ? AuditActionType.SELF_ASSESSMENT_FORM_RESUBMITTED_AFTER_UNLOCK
                        : AuditActionType.SELF_ASSESSMENT_FORM_SUBMITTED,
                AuditTargetType.SELF_ASSESSMENT_FORM,
                saved.getId(),
                employee.getUserAccount().getId(),
                null,
                (resubmittedAfterUnlock ? "Resubmitted unlocked self-assessment form with score " : "Submitted self-assessment form with score ")
                        + saved.getTotalScore(),
                null);

        if (managerOwnedForm) {
            sendHrManagerSelfAssessmentSubmittedNotification(saved);
        } else {
            sendManagerSubmissionNotification(employee, saved);
        }

        return toFormDto(saved);
    }

    @Transactional
    public SelfAssessmentSettingsDto getSettings() {
        return toSettingsDto(getOrCreateSettings());
    }

    @Transactional
    public SelfAssessmentSettingsDto updateSettings(SelfAssessmentSettingsRequest request, Long userId) {
        SelfAssessmentRatingSystem targetRatingSystem = parseRatingSystem(request.ratingSystem());
        int targetTenPointYesMinRating = parseTenPointYesMinRating(request.tenPointYesMinRating());
        SelfAssessmentSettings settings = getOrCreateSettings();
        settings.setRatingSystem(targetRatingSystem);
        settings.setTenPointYesMinRating(targetTenPointYesMinRating);
        settings.setUpdatedBy(userId);
        settings.setUpdatedOn(Instant.now());
        settingsRepository.save(settings);
        syncUnassignedTemplatesInActiveCycle(targetRatingSystem, targetTenPointYesMinRating, userId);
        return toSettingsDto(settings);
    }

    @Transactional
    public List<FormListDto> getManagerReviewForms(Employee manager) {
        ReviewCycle activeCycle = getActiveCycle();
        if (activeCycle == null) {
            return List.of();
        }

        return formRepository.findByManagerAndCycle(manager.getId(), activeCycle).stream()
                .peek(this::normalizeOverdueDraftForm)
                .filter(f -> REVIEW_QUEUE_VISIBLE_STATUSES.contains(f.getStatus()))
                .map(this::toFormListDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<FormListDto> getHrReviewForms() {
        ReviewCycle activeCycle = getActiveCycle();
        if (activeCycle == null) {
            return List.of();
        }

        return formRepository.findAll().stream()
                .filter(f -> f.getCycle().equals(activeCycle))
                .peek(this::normalizeOverdueDraftForm)
                .filter(f -> REVIEW_QUEUE_VISIBLE_STATUSES.contains(f.getStatus()))
                .map(this::toFormListDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<FormListDto> getAllFormsForHr() {
        ReviewCycle activeCycle = getActiveCycle();
        if (activeCycle == null) {
            return List.of();
        }

        return formRepository.findByCycleOrderByCreatedDateDesc(activeCycle).stream()
                .peek(this::normalizeOverdueDraftForm)
                .map(this::toFormListDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ActiveCycleFormsDto getActiveCycleFormsForHr() {
        ReviewCycle activeCycle = requireActiveCycle();
        List<FormListDto> forms = formRepository.findByCycleOrderByCreatedDateDesc(activeCycle).stream()
                .peek(this::normalizeOverdueDraftForm)
                .map(this::toFormListDto)
                .collect(Collectors.toList());
        return new ActiveCycleFormsDto(toCycleInfo(activeCycle), forms);
    }

    @Transactional
    public ActiveCycleFormsDto getActiveCycleFormsForManager(Employee manager) {
        ReviewCycle activeCycle = requireActiveCycle();
        List<FormListDto> forms = formRepository.findByCycleOrderByCreatedDateDesc(activeCycle).stream()
                .peek(this::normalizeOverdueDraftForm)
                .filter(form -> canManagerAccessForm(form, manager))
                .map(this::toFormListDto)
                .collect(Collectors.toList());
        return new ActiveCycleFormsDto(toCycleInfo(activeCycle), forms);
    }

    @Transactional(readOnly = true)
    public SelfAssessmentFormDto getFormById(Long formId) {
        SelfAssessmentForm form = formRepository.findById(formId)
                .orElseThrow(() -> new RuntimeException("Form not found"));
        return toFormDto(form);
    }

    @Transactional(readOnly = true)
    public SelfAssessmentFormDto getFormByIdForRole(Long formId, Employee employee, Long roleId) {
        SelfAssessmentForm form = formRepository.findById(formId)
                .orElseThrow(() -> new RuntimeException("Form not found"));

        if (roleId != null && roleId == 1L) {
            return toFormDto(form);
        }
        if (roleId != null && roleId == 2L && canManagerAccessForm(form, employee)) {
            return toFormDto(form);
        }
        if (roleId != null && (roleId == 3L || roleId == 4L) && isOwnForm(form, employee)) {
            return toFormDto(form);
        }

        throw new RuntimeException("You are not authorized to view this form");
    }

    @Transactional
    public SelfAssessmentFormDto managerReview(Long formId, Employee manager, ManagerReviewRequest request) {
        SelfAssessmentForm form = formRepository.findById(formId)
                .orElseThrow(() -> new RuntimeException("Form not found"));

        if (!canManagerReview(form, manager)) {
            throw new RuntimeException("You are not authorized to review this form");
        }

        if (form.getStatus() != SelfAssessmentFormStatus.PENDING_MANAGER_REVIEW
                && form.getStatus() != SelfAssessmentFormStatus.SUBMITTED) {
            throw new RuntimeException("Form is not pending manager review");
        }
        requireManagerReviewComments(request.comments());

        Signature defaultSig = signatureRepository.findByUserAndIsDefaultTrue(manager.getUserAccount())
                .orElseThrow(() -> new RuntimeException("No default signature found. Please set up your signature before reviewing."));

        form.setManager(manager);
        form.setManagerSignatureId(defaultSig.getId());
        form.setManagerSignatureDate(Instant.now());
        form.setManagerComments(request.comments().trim());
        form.setEmployeeAcknowledgedAt(null);
        form.setEmployeeDisputedAt(null);
        form.setEmployeeDisputeReason(null);
        form.setHrReviewRequired(null);
        form.setHrReviewReason(null);
        form.setHrReviewReasonAt(null);
        form.setRequiresHrReview(null);
        form.setUpdatedDate(Instant.now());

        boolean anyScoreChanged = false;
        boolean hasManagerAdjustments = request.adjustments() != null && !request.adjustments().isEmpty();
        if (hasManagerAdjustments) {
            SelfAssessmentRatingSystem ratingSystem = SelfAssessmentRatingSystem.defaultIfNull(form.getRatingSystem());
            int tenPointYesMinRating = resolveSavedTenPointYesMinRating(form.getTenPointYesMinRating());
            for (ManagerAdjustmentRequest adj : request.adjustments()) {
                if (!ratingSystem.isValidYesNo(adj.proposedYesNo()) || adj.proposedRating() == null
                        || !ratingSystem.isValidRating(adj.proposedYesNo(), adj.proposedRating(), tenPointYesMinRating)) {
                    throw new RuntimeException("Proposed rating does not match the form rating system");
                }
                for (SelfAssessmentFormAnswer answer : form.getAnswers()) {
                    if (answer.getId().equals(adj.answerId())) {
                        if (Objects.equals(adj.proposedYesNo(), answer.getYesNoAnswer())
                                && Objects.equals(adj.proposedRating(), answer.getRating())) {
                            throw new RuntimeException(
                                    "Proposed adjustment must differ from the employee's current answer");
                        }
                        if (!adj.proposedYesNo().equals(answer.getYesNoAnswer())
                                || !adj.proposedRating().equals(answer.getRating())) {
                            anyScoreChanged = true;
                        }
                        answer.setManagerProposedYesNo(adj.proposedYesNo());
                        answer.setManagerProposedRating(adj.proposedRating());
                        answer.setManagerProposedComment(adj.comment());
                        break;
                    }
                }

                SelfAssessmentFormAdjustment adjustment = new SelfAssessmentFormAdjustment();
                adjustment.setForm(form);
                adjustment.setQuestionText(findQuestionText(form, adj.answerId()));
                adjustment.setSortOrder(findSortOrder(form, adj.answerId()));
                adjustment.setOriginalYesNo(findOriginalYesNo(form, adj.answerId()));
                adjustment.setOriginalRating(findOriginalRating(form, adj.answerId()));
                adjustment.setProposedYesNo(adj.proposedYesNo());
                adjustment.setProposedRating(adj.proposedRating());
                adjustment.setManagerComment(adj.comment());
                adjustment.setAdjustedAt(Instant.now());
                adjustment.setAdjustedBy(manager.getId());
                adjustmentRepository.save(adjustment);
            }

            auditService.record(
                    AuditActionType.SELF_ASSESSMENT_FORM_MANAGER_ADJUSTMENT_PROPOSED,
                    AuditTargetType.SELF_ASSESSMENT_FORM,
                    form.getId(),
                    manager.getUserAccount().getId(),
                    null,
                    "Manager proposed adjustments for self-assessment form",
                    null);
        }

        calculateManagerRevisedScore(form);

        boolean skipEmployeeAcknowledgment = !anyScoreChanged;
        if (skipEmployeeAcknowledgment) {
            form.setStatus(SelfAssessmentFormStatus.PENDING_FINAL_APPROVAL);
        } else {
            form.setStatus(SelfAssessmentFormStatus.PENDING_EMPLOYEE_REVIEW);
        }

        SelfAssessmentForm saved = formRepository.save(form);

        auditService.record(
                AuditActionType.SELF_ASSESSMENT_FORM_MANAGER_REVIEWED,
                AuditTargetType.SELF_ASSESSMENT_FORM,
                saved.getId(),
                manager.getUserAccount().getId(),
                null,
                "Manager reviewed self-assessment form",
                null);

        if (skipEmployeeAcknowledgment) {
            auditService.record(
                    AuditActionType.SELF_ASSESSMENT_FORM_SUBMITTED,
                    AuditTargetType.SELF_ASSESSMENT_FORM,
                    saved.getId(),
                    manager.getUserAccount().getId(),
                    null,
                    "Employee acknowledgment skipped: manager made no score adjustments; pending HR final approval",
                    null);
            sendHrFinalApprovalNotification(saved, true);
        } else {
            sendManagerReviewNotificationsNew(saved, anyScoreChanged, hasManagerAdjustments);
        }

        return toFormDto(saved);
    }

    @Transactional
    public SelfAssessmentFormDto managerRequestRetake(Long formId, Employee manager, ManagerRetakeRequest request) {
        SelfAssessmentForm form = formRepository.findById(formId)
                .orElseThrow(() -> new RuntimeException("Form not found"));

        if (!canManagerReview(form, manager)) {
            throw new RuntimeException("You are not authorized to request a retake for this form");
        }
        if (form.getStatus() != SelfAssessmentFormStatus.PENDING_MANAGER_REVIEW
                && form.getStatus() != SelfAssessmentFormStatus.SUBMITTED) {
            throw new RuntimeException("Form is not pending manager review");
        }
        if (Boolean.TRUE.equals(form.getRetakeRequestUsed())) {
            throw new RuntimeException("A retake has already been requested for this form");
        }
        if (request.retakeRequests() == null || request.retakeRequests().isEmpty()) {
            throw new RuntimeException("Select at least one question for retake");
        }
        requireManagerReviewComments(request.comments());

        Map<Long, SelfAssessmentFormAnswer> answersById = form.getAnswers().stream()
                .collect(Collectors.toMap(SelfAssessmentFormAnswer::getId, a -> a));
        Set<Long> selectedAnswerIds = new HashSet<>();
        for (RetakeQuestionRequest retake : request.retakeRequests()) {
            if (retake.answerId() == null || !answersById.containsKey(retake.answerId())) {
                throw new RuntimeException("Retake request contains an invalid answer");
            }
            if (retake.comment() == null || retake.comment().trim().isBlank()) {
                throw new RuntimeException("A warning comment is required for each retake question");
            }
            if (!selectedAnswerIds.add(retake.answerId())) {
                throw new RuntimeException("Duplicate retake question selected");
            }
        }

        Signature defaultSig = signatureRepository.findByUserAndIsDefaultTrue(manager.getUserAccount())
                .orElseThrow(() -> new RuntimeException("No default signature found. Please set up your signature before requesting a retake."));

        Instant now = Instant.now();
        form.setManager(manager);
        form.setManagerSignatureId(defaultSig.getId());
        form.setManagerSignatureDate(now);
        form.setManagerComments(request.comments().trim());
        form.setRetakeRequestedAt(now);
        form.setRetakeSubmittedAt(null);
        form.setRetakeRequestUsed(true);
        form.setManagerApprovedRetakeAt(null);
        form.setUpdatedDate(now);
        form.setStatus(SelfAssessmentFormStatus.PENDING_EMPLOYEE_RETAKE);

        for (SelfAssessmentFormAnswer answer : form.getAnswers()) {
            answer.setRetakeRequested(false);
            answer.setRetakeRequestComment(null);
            answer.setRetakeYesNoAnswer(null);
            answer.setRetakeRating(null);
            answer.setRetakeReason(null);
            answer.setRetakeSubmittedAt(null);
            answer.setRetakeApproved(null);
        }
        for (RetakeQuestionRequest retake : request.retakeRequests()) {
            SelfAssessmentFormAnswer answer = answersById.get(retake.answerId());
            answer.setRetakeRequested(true);
            answer.setRetakeRequestComment(retake.comment().trim());
        }

        SelfAssessmentForm saved = formRepository.save(form);
        auditService.record(
                AuditActionType.SELF_ASSESSMENT_FORM_MANAGER_REVIEWED,
                AuditTargetType.SELF_ASSESSMENT_FORM,
                saved.getId(),
                manager.getUserAccount().getId(),
                null,
                "Manager requested a one-time retake for selected self-assessment questions",
                null);
        sendEmployeeRetakeNotification(saved);
        return toFormDto(saved);
    }

    @Transactional
    public SelfAssessmentFormDto employeeSubmitRetake(Long formId, Employee employee, EmployeeRetakeSubmitRequest request) {
        SelfAssessmentForm form = formRepository.findById(formId)
                .orElseThrow(() -> new RuntimeException("Form not found"));

        if (!form.getEmployee().getId().equals(employee.getId())) {
            throw new RuntimeException("You are not authorized to retake this form");
        }
        if (form.getStatus() != SelfAssessmentFormStatus.PENDING_EMPLOYEE_RETAKE) {
            throw new RuntimeException("Form is not pending employee retake");
        }

        List<SelfAssessmentFormAnswer> retakeAnswers = form.getAnswers().stream()
                .filter(a -> Boolean.TRUE.equals(a.getRetakeRequested()))
                .toList();
        if (retakeAnswers.isEmpty()) {
            throw new RuntimeException("No questions are marked for retake");
        }
        if (request.answers() == null) {
            throw new RuntimeException("Retake answers are required");
        }

        Map<Long, EmployeeRetakeAnswerRequest> submittedById = new HashMap<>();
        for (EmployeeRetakeAnswerRequest answerRequest : request.answers()) {
            if (answerRequest.answerId() != null) {
                submittedById.put(answerRequest.answerId(), answerRequest);
            }
        }

        SelfAssessmentRatingSystem ratingSystem = SelfAssessmentRatingSystem.defaultIfNull(form.getRatingSystem());
        int tenPointYesMinRating = resolveSavedTenPointYesMinRating(form.getTenPointYesMinRating());
        Instant now = Instant.now();
        for (SelfAssessmentFormAnswer answer : retakeAnswers) {
            EmployeeRetakeAnswerRequest retake = submittedById.get(answer.getId());
            if (retake == null) {
                throw new RuntimeException("Submit a retake response for every warned question");
            }
            if (!ratingSystem.isValidYesNo(retake.yesNoAnswer()) || retake.yesNoAnswer() == null
                    || retake.rating() == null
                    || !ratingSystem.isValidRating(retake.yesNoAnswer(), retake.rating(), tenPointYesMinRating)) {
                throw new RuntimeException("Retake rating does not match the form rating system");
            }
            if (retake.reason() == null || retake.reason().trim().isBlank()) {
                throw new RuntimeException("A retake reason is required for every warned question");
            }
            answer.setRetakeYesNoAnswer(retake.yesNoAnswer());
            answer.setRetakeRating(retake.rating());
            answer.setRetakeReason(retake.reason().trim());
            answer.setRetakeSubmittedAt(now);
            answer.setRetakeApproved(null);
        }

        form.setRetakeSubmittedAt(now);
        boolean managerOwnedForm = isManagerOwnedForm(form);
        form.setStatus(managerOwnedForm
                ? SelfAssessmentFormStatus.PENDING_FINAL_APPROVAL
                : SelfAssessmentFormStatus.PENDING_RETAKE_MANAGER_REVIEW);
        form.setUpdatedDate(now);
        SelfAssessmentForm saved = formRepository.save(form);

        auditService.record(
                AuditActionType.SELF_ASSESSMENT_FORM_SUBMITTED,
                AuditTargetType.SELF_ASSESSMENT_FORM,
                saved.getId(),
                employee.getUserAccount().getId(),
                null,
                "Employee submitted retake answers for selected self-assessment questions",
                null);
        if (managerOwnedForm) {
            sendHrManagerSelfAssessmentRetakeSubmittedNotification(saved);
        } else {
            sendManagerRetakeSubmittedNotification(saved);
        }
        return toFormDto(saved);
    }

    @Transactional
    public SelfAssessmentFormDto hrRequestRetake(Long formId, ManagerRetakeRequest request, Long hrUserId) {
        SelfAssessmentForm form = formRepository.findById(formId)
                .orElseThrow(() -> new RuntimeException("Form not found"));

        if (!isManagerOwnedForm(form)) {
            throw new RuntimeException("HR retake requests are only allowed for manager self-assessments");
        }
        if (form.getStatus() != SelfAssessmentFormStatus.PENDING_FINAL_APPROVAL) {
            throw new RuntimeException("Form is not pending HR final approval");
        }
        if (Boolean.TRUE.equals(form.getRetakeRequestUsed())) {
            throw new RuntimeException("A retake has already been requested for this form");
        }
        if (request.retakeRequests() == null || request.retakeRequests().isEmpty()) {
            throw new RuntimeException("Select at least one question for retake");
        }
        requireManagerReviewComments(request.comments());

        Map<Long, SelfAssessmentFormAnswer> answersById = form.getAnswers().stream()
                .collect(Collectors.toMap(SelfAssessmentFormAnswer::getId, a -> a));
        Set<Long> selectedAnswerIds = new HashSet<>();
        for (RetakeQuestionRequest retake : request.retakeRequests()) {
            if (retake.answerId() == null || !answersById.containsKey(retake.answerId())) {
                throw new RuntimeException("Retake request contains an invalid answer");
            }
            if (retake.comment() == null || retake.comment().trim().isBlank()) {
                throw new RuntimeException("A warning comment is required for each retake question");
            }
            if (!selectedAnswerIds.add(retake.answerId())) {
                throw new RuntimeException("Duplicate retake question selected");
            }
        }

        User hrUser = findHrUser(hrUserId);
        Signature defaultSig = signatureRepository.findByUserAndIsDefaultTrue(hrUser)
                .orElseThrow(() -> new RuntimeException("No default signature found. Please set up your signature before requesting a retake."));

        Instant now = Instant.now();
        form.setManager(hrUser.getEmployee());
        form.setManagerSignatureId(defaultSig.getId());
        form.setManagerSignatureDate(now);
        form.setManagerComments(request.comments().trim());
        form.setRetakeRequestedAt(now);
        form.setRetakeSubmittedAt(null);
        form.setRetakeRequestUsed(true);
        form.setManagerApprovedRetakeAt(null);
        form.setUpdatedDate(now);
        form.setStatus(SelfAssessmentFormStatus.PENDING_EMPLOYEE_RETAKE);

        for (SelfAssessmentFormAnswer answer : form.getAnswers()) {
            answer.setRetakeRequested(false);
            answer.setRetakeRequestComment(null);
            answer.setRetakeYesNoAnswer(null);
            answer.setRetakeRating(null);
            answer.setRetakeReason(null);
            answer.setRetakeSubmittedAt(null);
            answer.setRetakeApproved(null);
        }
        for (RetakeQuestionRequest retake : request.retakeRequests()) {
            SelfAssessmentFormAnswer answer = answersById.get(retake.answerId());
            answer.setRetakeRequested(true);
            answer.setRetakeRequestComment(retake.comment().trim());
        }

        SelfAssessmentForm saved = formRepository.save(form);
        auditService.record(
                AuditActionType.SELF_ASSESSMENT_FORM_MANAGER_REVIEWED,
                AuditTargetType.SELF_ASSESSMENT_FORM,
                saved.getId(),
                hrUserId,
                null,
                "HR requested a one-time retake for selected manager self-assessment questions",
                null);
        sendManagerSelfAssessmentRetakeNotification(saved);
        return toFormDto(saved);
    }

    @Transactional
    public SelfAssessmentFormDto managerApproveRetake(Long formId, Employee manager, ManagerApproveRetakeRequest request) {
        SelfAssessmentForm form = formRepository.findById(formId)
                .orElseThrow(() -> new RuntimeException("Form not found"));

        if (!canManagerReview(form, manager)) {
            throw new RuntimeException("You are not authorized to approve this retake");
        }
        if (form.getStatus() != SelfAssessmentFormStatus.PENDING_RETAKE_MANAGER_REVIEW) {
            throw new RuntimeException("Form is not pending retake manager review");
        }

        Signature defaultSig = signatureRepository.findByUserAndIsDefaultTrue(manager.getUserAccount())
                .orElseThrow(() -> new RuntimeException("No default signature found. Please set up your signature before approving the retake."));

        Instant now = Instant.now();
        form.setManager(manager);
        form.setManagerSignatureId(defaultSig.getId());
        form.setManagerSignatureDate(now);
        if (request != null && request.comments() != null) {
            form.setManagerComments(request.comments());
        }

        for (SelfAssessmentFormAnswer answer : form.getAnswers()) {
            if (Boolean.TRUE.equals(answer.getRetakeRequested())) {
                if (answer.getRetakeYesNoAnswer() == null || answer.getRetakeRating() == null) {
                    throw new RuntimeException("All requested retake questions must be submitted before approval");
                }
                answer.setFinalApprovedYesNo(answer.getRetakeYesNoAnswer());
                answer.setFinalApprovedRating(answer.getRetakeRating());
                answer.setRetakeApproved(true);
            } else {
                answer.setFinalApprovedYesNo(answer.getYesNoAnswer());
                answer.setFinalApprovedRating(answer.getRating());
            }
        }

        calculateFinalApprovedScore(form);
        form.setManagerRevisedTotalScore(form.getFinalApprovedTotalScore());
        form.setManagerApprovedRetakeAt(now);
        form.setStatus(SelfAssessmentFormStatus.PENDING_FINAL_APPROVAL);
        form.setUpdatedDate(now);

        SelfAssessmentForm saved = formRepository.save(form);
        auditService.record(
                AuditActionType.SELF_ASSESSMENT_FORM_MANAGER_REVIEWED,
                AuditTargetType.SELF_ASSESSMENT_FORM,
                saved.getId(),
                manager.getUserAccount().getId(),
                null,
                "Manager approved retake answers. Score: " + saved.getFinalApprovedTotalScore(),
                null);
        sendHrFinalApprovalNotification(saved, false);
        return toFormDto(saved);
    }

    @Transactional
    public SelfAssessmentFormDto managerForceChangeRetake(Long formId, Employee manager, ManagerForceChangeRetakeRequest request) {
        SelfAssessmentForm form = formRepository.findById(formId)
                .orElseThrow(() -> new RuntimeException("Form not found"));

        if (!canManagerReview(form, manager)) {
            throw new RuntimeException("You are not authorized to force-change this retake");
        }
        if (form.getStatus() != SelfAssessmentFormStatus.PENDING_RETAKE_MANAGER_REVIEW) {
            throw new RuntimeException("Form is not pending retake manager review");
        }

        List<SelfAssessmentFormAnswer> flaggedAnswers = form.getAnswers().stream()
                .filter(answer -> Boolean.TRUE.equals(answer.getRetakeRequested()))
                .toList();
        if (flaggedAnswers.isEmpty()) {
            throw new RuntimeException("No questions are marked for retake");
        }
        if (request == null || request.answers() == null) {
            throw new RuntimeException("Submit a final value for every warned question");
        }

        Map<Long, ManagerForceChangeRetakeAnswerRequest> requestedById = new HashMap<>();
        for (ManagerForceChangeRetakeAnswerRequest answerRequest : request.answers()) {
            if (answerRequest.answerId() == null) {
                throw new RuntimeException("Answer id is required");
            }
            if (requestedById.put(answerRequest.answerId(), answerRequest) != null) {
                throw new RuntimeException("Duplicate retake question selected");
            }
        }
        Set<Long> flaggedIds = flaggedAnswers.stream()
                .map(SelfAssessmentFormAnswer::getId)
                .collect(Collectors.toSet());
        if (!flaggedIds.equals(requestedById.keySet())) {
            throw new RuntimeException("Submit final values for retake-requested questions only");
        }

        SelfAssessmentRatingSystem ratingSystem = SelfAssessmentRatingSystem.defaultIfNull(form.getRatingSystem());
        int tenPointYesMinRating = resolveSavedTenPointYesMinRating(form.getTenPointYesMinRating());
        Instant now = Instant.now();
        String beforeSnapshot = snapshotAnswers(form);

        for (SelfAssessmentFormAnswer answer : flaggedAnswers) {
            ManagerForceChangeRetakeAnswerRequest finalValue = requestedById.get(answer.getId());
            if (finalValue == null) {
                throw new RuntimeException("Submit a final value for every warned question");
            }
            if (answer.getRetakeYesNoAnswer() == null || answer.getRetakeRating() == null) {
                throw new RuntimeException("All requested retake questions must be submitted before force change");
            }
            if (!ratingSystem.isValidYesNo(finalValue.finalYesNoAnswer())
                    || finalValue.finalYesNoAnswer() == null
                    || finalValue.finalRating() == null
                    || !ratingSystem.isValidRating(finalValue.finalYesNoAnswer(), finalValue.finalRating(), tenPointYesMinRating)) {
                throw new RuntimeException("Invalid final answer or rating");
            }
            boolean changed = !Objects.equals(answer.getRetakeYesNoAnswer(), finalValue.finalYesNoAnswer())
                    || !Objects.equals(answer.getRetakeRating(), finalValue.finalRating());
            String reason = finalValue.reason() != null ? finalValue.reason().trim() : "";
            if (changed && reason.isBlank()) {
                throw new RuntimeException("A reason is required for every changed warned question");
            }

            answer.setFinalApprovedYesNo(finalValue.finalYesNoAnswer());
            answer.setFinalApprovedRating(finalValue.finalRating());
            answer.setRetakeApproved(!changed);
            answer.setManagerForceChanged(changed);
            answer.setManagerForceChangeReason(changed ? reason : null);
            answer.setManagerForceChangedAt(changed ? now : null);
        }

        for (SelfAssessmentFormAnswer answer : form.getAnswers()) {
            if (!flaggedIds.contains(answer.getId())) {
                answer.setFinalApprovedYesNo(answer.getYesNoAnswer());
                answer.setFinalApprovedRating(answer.getRating());
                answer.setManagerForceChanged(false);
                answer.setManagerForceChangeReason(null);
                answer.setManagerForceChangedAt(null);
            }
        }

        form.setManager(manager);
        if (request.comments() != null) {
            form.setManagerComments(request.comments());
        }
        calculateFinalApprovedScore(form);
        form.setManagerRevisedTotalScore(form.getFinalApprovedTotalScore());
        form.setManagerForceChangeApprovedAt(now);
        form.setStatus(SelfAssessmentFormStatus.PENDING_FINAL_APPROVAL);
        form.setUpdatedDate(now);

        SelfAssessmentForm saved = formRepository.save(form);
        auditService.record(
	                AuditActionType.SELF_ASSESSMENT_FORM_MANAGER_FORCE_CHANGED_RETAKE,
	                AuditTargetType.SELF_ASSESSMENT_FORM,
	                saved.getId(),
	                manager.getUserAccount().getId(),
	                null,
	                "Manager force-changed retake final values. Score: " + saved.getFinalApprovedTotalScore(),
	                null,
	                beforeSnapshot,
	                snapshotAnswers(saved));
        sendHrFinalApprovalNotification(saved, false);
        return toFormDto(saved);
    }

    @Transactional
    public SelfAssessmentFormDto employeeAcknowledge(Long formId, Employee employee) {
        SelfAssessmentForm form = formRepository.findById(formId)
                .orElseThrow(() -> new RuntimeException("Form not found"));

        if (!form.getEmployee().getId().equals(employee.getId())) {
            throw new RuntimeException("You are not authorized to acknowledge this form");
        }

        if (form.getStatus() != SelfAssessmentFormStatus.PENDING_EMPLOYEE_REVIEW) {
            throw new RuntimeException("Form is not pending employee review");
        }

        form.setEmployeeAcknowledgedAt(Instant.now());
        form.setStatus(SelfAssessmentFormStatus.PENDING_FINAL_APPROVAL);
        form.setUpdatedDate(Instant.now());

        SelfAssessmentForm saved = formRepository.save(form);

        auditService.record(
                AuditActionType.SELF_ASSESSMENT_FORM_SUBMITTED,
                AuditTargetType.SELF_ASSESSMENT_FORM,
                saved.getId(),
                employee.getUserAccount().getId(),
                null,
                "Employee acknowledged manager review",
                null);

        sendHrFinalApprovalNotification(saved, false);

        return toFormDto(saved);
    }

    @Transactional
    public SelfAssessmentFormDto employeeDispute(Long formId, Employee employee, EmployeeDisputeRequest request) {
        SelfAssessmentForm form = formRepository.findById(formId)
                .orElseThrow(() -> new RuntimeException("Form not found"));

        if (!form.getEmployee().getId().equals(employee.getId())) {
            throw new RuntimeException("You are not authorized to dispute this form");
        }

        if (form.getStatus() != SelfAssessmentFormStatus.PENDING_EMPLOYEE_REVIEW) {
            throw new RuntimeException("Form is not pending employee review");
        }

        if (request.disputeReason() == null || request.disputeReason().trim().isBlank()) {
            throw new RuntimeException("Dispute reason is required");
        }

        form.setEmployeeDisputedAt(Instant.now());
        form.setEmployeeDisputeReason(request.disputeReason().trim());
        form.setStatus(SelfAssessmentFormStatus.PENDING_HR_CALIBRATION_REVIEW);
        form.setHrReviewRequired(true);
        form.setUpdatedDate(Instant.now());

        SelfAssessmentForm saved = formRepository.save(form);

        auditService.record(
                AuditActionType.SELF_ASSESSMENT_FORM_SUBMITTED,
                AuditTargetType.SELF_ASSESSMENT_FORM,
                saved.getId(),
                employee.getUserAccount().getId(),
                null,
                "Employee disputed manager review",
                null);

        sendHrDisputeNotification(saved);

        return toFormDto(saved);
    }

    @Transactional
    public SelfAssessmentFormDto hrApproveManagerReview(Long formId, HrApproveManagerReviewRequest request, Long hrUserId) {
        SelfAssessmentForm form = formRepository.findById(formId)
                .orElseThrow(() -> new RuntimeException("Form not found"));

        if (form.getStatus() != SelfAssessmentFormStatus.MANAGER_REVIEWED
                && form.getStatus() != SelfAssessmentFormStatus.PENDING_HR_CALIBRATION_REVIEW
                && form.getStatus() != SelfAssessmentFormStatus.PENDING_FINAL_APPROVAL) {
            throw new RuntimeException("Form is not eligible for HR adjustment approval");
        }

        User hrUser = findHrUser(hrUserId);

        Signature defaultSig = signatureRepository.findByUserAndIsDefaultTrue(hrUser)
                .orElseThrow(() -> new RuntimeException("No default signature found. Please set up your signature before approving."));

        form.setHrAdjustmentSignatureId(defaultSig.getId());
        form.setHrAdjustmentSignatureDate(Instant.now());
        recordHrSigner(form, hrUser);

        for (SelfAssessmentFormAnswer answer : form.getAnswers()) {
            if (answer.getManagerProposedYesNo() != null) {
                answer.setFinalApprovedYesNo(answer.getManagerProposedYesNo());
                answer.setFinalApprovedRating(answer.getManagerProposedRating());
                answer.setHrAdjustmentApproved(true);
            } else {
                answer.setFinalApprovedYesNo(answer.getYesNoAnswer());
                answer.setFinalApprovedRating(answer.getRating());
            }
        }

        calculateFinalApprovedScore(form);
        form.setUpdatedDate(Instant.now());

        SelfAssessmentForm saved = formRepository.save(form);

        auditService.record(
                AuditActionType.SELF_ASSESSMENT_FORM_HR_APPROVED_ADJUSTMENT,
                AuditTargetType.SELF_ASSESSMENT_FORM,
                saved.getId(),
                hrUserId,
                null,
                "HR approved manager adjustments into final approved fields. Score: " + saved.getFinalApprovedTotalScore(),
                null);

        return toFormDto(saved);
    }

    @Transactional
    public SelfAssessmentFormDto hrRejectManagerReview(Long formId, HrRejectManagerReviewRequest request, Long hrUserId) {
        SelfAssessmentForm form = formRepository.findById(formId)
                .orElseThrow(() -> new RuntimeException("Form not found"));

        if (form.getStatus() != SelfAssessmentFormStatus.MANAGER_REVIEWED
                && form.getStatus() != SelfAssessmentFormStatus.PENDING_HR_CALIBRATION_REVIEW
                && form.getStatus() != SelfAssessmentFormStatus.PENDING_EMPLOYEE_REVIEW
                && form.getStatus() != SelfAssessmentFormStatus.PENDING_FINAL_APPROVAL) {
            throw new RuntimeException("Form is not eligible for HR adjustment rejection");
        }

        User hrUser = findHrUser(hrUserId);

        Signature defaultSig = signatureRepository.findByUserAndIsDefaultTrue(hrUser)
                .orElseThrow(() -> new RuntimeException("No default signature found. Please set up your signature before rejecting."));

        form.setHrAdjustmentSignatureId(defaultSig.getId());
        form.setHrAdjustmentSignatureDate(Instant.now());
        recordHrSigner(form, hrUser);

        for (SelfAssessmentFormAnswer answer : form.getAnswers()) {
            answer.setManagerProposedYesNo(null);
            answer.setManagerProposedRating(null);
            answer.setManagerProposedComment(null);
            answer.setHrAdjustmentApproved(null);
            answer.setFinalApprovedYesNo(null);
            answer.setFinalApprovedRating(null);
        }

        form.setManagerRevisedTotalScore(null);
        form.setFinalApprovedTotalScore(null);
        form.setEmployeeAcknowledgedAt(null);
        form.setEmployeeDisputedAt(null);
        form.setStatus(SelfAssessmentFormStatus.PENDING_MANAGER_REVIEW);
        form.setUpdatedDate(Instant.now());

        SelfAssessmentForm saved = formRepository.save(form);

        auditService.record(
                AuditActionType.SELF_ASSESSMENT_FORM_HR_REJECTED_ADJUSTMENT,
                AuditTargetType.SELF_ASSESSMENT_FORM,
                saved.getId(),
                hrUserId,
                null,
                "HR rejected manager adjustments. Reason: " + request.rejectionReason(),
                null);

        return toFormDto(saved);
    }

    @Transactional
    public SelfAssessmentFormDto hrReturnDisputedReview(Long formId, HrReturnDisputedReviewRequest request, Long hrUserId) {
        SelfAssessmentForm form = formRepository.findById(formId)
                .orElseThrow(() -> new RuntimeException("Form not found"));

        if (form.getStatus() != SelfAssessmentFormStatus.PENDING_HR_CALIBRATION_REVIEW) {
            throw new RuntimeException("Form is not pending HR dispute review");
        }

        if (request.reason() == null || request.reason().trim().isBlank()) {
            throw new RuntimeException("HR return reason is required");
        }

        String reason = request.reason().trim();
        for (SelfAssessmentFormAnswer answer : form.getAnswers()) {
            answer.setManagerProposedYesNo(null);
            answer.setManagerProposedRating(null);
            answer.setManagerProposedComment(null);
            answer.setHrAdjustmentApproved(null);
            answer.setFinalApprovedYesNo(null);
            answer.setFinalApprovedRating(null);
        }

        form.setManagerSignatureId(null);
        form.setManagerSignatureDate(null);
        form.setManagerComments(null);
        form.setManagerRevisedTotalScore(null);
        form.setFinalApprovedTotalScore(null);
        form.setEmployeeAcknowledgedAt(null);
        form.setHrReviewRequired(true);
        form.setHrReviewReason(reason);
        form.setHrReviewReasonAt(Instant.now());
        form.setStatus(SelfAssessmentFormStatus.PENDING_MANAGER_REVIEW);
        form.setUpdatedDate(Instant.now());

        SelfAssessmentForm saved = formRepository.save(form);

        auditService.record(
                AuditActionType.SELF_ASSESSMENT_FORM_HR_SENT_BACK_TO_MANAGER,
                AuditTargetType.SELF_ASSESSMENT_FORM,
                saved.getId(),
                hrUserId,
                null,
                "HR returned disputed manager review to manager. Reason: " + reason,
                null);

        sendManagerDisputeReturnNotification(saved, reason);

        return toFormDto(saved);
    }

    @Transactional
    public SelfAssessmentFormDto hrApproveForm(Long formId, HrApproveFormRequest request, Long hrUserId) {
        SelfAssessmentForm form = formRepository.findById(formId)
                .orElseThrow(() -> new RuntimeException("Form not found"));

        if (form.getStatus() != SelfAssessmentFormStatus.PENDING_FINAL_APPROVAL) {
            throw new RuntimeException("Form is not eligible for final approval");
        }

        User hrUser = findHrUser(hrUserId);

        Signature defaultSig = signatureRepository.findByUserAndIsDefaultTrue(hrUser)
                .orElseThrow(() -> new RuntimeException("No default signature found. Please set up your signature before approving."));

        // Populate finalApproved fields if manager approval did not already do so.
        boolean finalApprovedMissing = form.getAnswers().stream()
                .allMatch(a -> a.getFinalApprovedYesNo() == null);
        if (finalApprovedMissing) {
            for (SelfAssessmentFormAnswer answer : form.getAnswers()) {
                if (Boolean.TRUE.equals(answer.getRetakeRequested()) && answer.getRetakeYesNoAnswer() != null) {
                    answer.setFinalApprovedYesNo(answer.getRetakeYesNoAnswer());
                    answer.setFinalApprovedRating(answer.getRetakeRating());
                } else if (answer.getManagerProposedYesNo() != null) {
                    answer.setFinalApprovedYesNo(answer.getManagerProposedYesNo());
                    answer.setFinalApprovedRating(answer.getManagerProposedRating());
                } else {
                    answer.setFinalApprovedYesNo(answer.getYesNoAnswer());
                    answer.setFinalApprovedRating(answer.getRating());
                }
            }
        }

        calculateFinalApprovedScore(form);
        form.setHrFinalSignatureId(defaultSig.getId());
        form.setHrFinalSignatureDate(Instant.now());
        recordHrSigner(form, hrUser);
        form.setStatus(SelfAssessmentFormStatus.FINALIZED_LOCKED);
        form.setUpdatedDate(Instant.now());

        SelfAssessmentForm saved = formRepository.save(form);

        auditService.record(
                AuditActionType.SELF_ASSESSMENT_FORM_HR_APPROVED,
                AuditTargetType.SELF_ASSESSMENT_FORM,
                saved.getId(),
                hrUserId,
                null,
                "HR finalized self-assessment form. Final score: " + saved.getFinalApprovedTotalScore(),
                null);

        return toFormDto(saved);
    }

    @Transactional
    public SelfAssessmentFormDto hrReopenForm(Long formId, HrReopenFormRequest request, Long hrUserId) {
        SelfAssessmentForm form = formRepository.findById(formId)
                .orElseThrow(() -> new RuntimeException("Form not found"));

        if (form.getStatus() != SelfAssessmentFormStatus.APPROVED
                && form.getStatus() != SelfAssessmentFormStatus.FINALIZED_LOCKED) {
            throw new RuntimeException("Only finalized forms can be reopened");
        }

        User hrUser = findHrUser(hrUserId);

        Signature defaultSig = signatureRepository.findByUserAndIsDefaultTrue(hrUser)
                .orElseThrow(() -> new RuntimeException("No default signature found. Please set up your signature before reopening."));

        form.setHrSignatureId(defaultSig.getId());
        recordHrSigner(form, hrUser);
        form.setStatus(SelfAssessmentFormStatus.REOPENED);
        form.setAssessmentDate(null);
        form.setSubmittedDate(null);
        form.setEmployeeSignatureId(null);
        form.setEmployeeSignatureDate(null);
        form.setManagerSignatureId(null);
        form.setManagerSignatureDate(null);
        form.setManagerComments(null);
        form.setManagerRevisedTotalScore(null);
        form.setFinalApprovedTotalScore(null);
        form.setEmployeeAcknowledgedAt(null);
        form.setEmployeeDisputedAt(null);
        form.setEmployeeDisputeReason(null);
        form.setHrReviewRequired(null);
        form.setHrReviewReason(null);
        form.setHrReviewReasonAt(null);
        form.setRequiresHrReview(null);
        form.setAffectsCompensationOrPip(null);
        form.setCompanyPolicyRequiresHrApproval(null);
        for (SelfAssessmentFormAnswer answer : form.getAnswers()) {
            answer.setManagerProposedYesNo(null);
            answer.setManagerProposedRating(null);
            answer.setManagerProposedComment(null);
            answer.setHrAdjustmentApproved(null);
            answer.setFinalApprovedYesNo(null);
            answer.setFinalApprovedRating(null);
        }
        form.setUpdatedDate(Instant.now());

        SelfAssessmentForm saved = formRepository.save(form);

        auditService.record(
                AuditActionType.SELF_ASSESSMENT_FORM_HR_REOPENED,
                AuditTargetType.SELF_ASSESSMENT_FORM,
                saved.getId(),
                hrUserId,
                null,
                "HR reopened self-assessment form for employee revision",
                null);

        return toFormDto(saved);
    }

    @Transactional
    public SelfAssessmentUnlockRequestDto requestUnlock(Long formId, Employee employee, SelfAssessmentUnlockRequestActionRequest request) {
        SelfAssessmentForm form = formRepository.findById(formId)
                .orElseThrow(() -> new RuntimeException("Form not found"));
        if (!isOwnForm(form, employee)) {
            throw new RuntimeException("You can only request unlock for your own form");
        }
        if (form.getStatus() != SelfAssessmentFormStatus.PENDING_MANAGER_REVIEW) {
            throw new RuntimeException("Only forms pending manager review can be unlocked");
        }
        if (unlockRequestRepository.existsByFormAndStatus(form, SelfAssessmentUnlockRequestStatus.PENDING)) {
            throw new RuntimeException("An unlock request is already pending for this form");
        }
        User requestedBy = employee.getUserAccount();
        if (requestedBy == null) {
            throw new RuntimeException("Employee user account not found");
        }
        SelfAssessmentUnlockRequest unlockRequest = new SelfAssessmentUnlockRequest();
        unlockRequest.setForm(form);
        unlockRequest.setEmployee(employee);
        unlockRequest.setRequestedBy(requestedBy);
        unlockRequest.setReasonCode(request.reasonCode());
        unlockRequest.setReasonText(normalizeReasonText(request.reasonText()));
        unlockRequest.setRequestedAt(Instant.now());
        SelfAssessmentUnlockRequest saved = unlockRequestRepository.save(unlockRequest);

        auditService.record(
                AuditActionType.SELF_ASSESSMENT_FORM_UNLOCK_REQUESTED,
                AuditTargetType.SELF_ASSESSMENT_FORM,
                form.getId(),
                requestedBy.getId(),
                null,
                "Employee requested HR unlock for submitted self-assessment form",
                null,
                snapshotAnswers(form),
                snapshotAnswers(form));

        sendHrUnlockRequestedNotification(saved);
        return toUnlockRequestDto(saved);
    }

    @Transactional(readOnly = true)
    public List<SelfAssessmentUnlockRequestDto> getHrUnlockRequests() {
        return unlockRequestRepository.findAllByOrderByRequestedAtDesc()
                .stream()
                .map(this::toUnlockRequestDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public SelfAssessmentUnlockRequestDto unlockSelfAssessmentRequest(
            Long requestId,
            SelfAssessmentUnlockRequestUnlockRequest request,
            Long hrUserId) {
        SelfAssessmentUnlockRequest unlockRequest = unlockRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Unlock request not found"));
        if (unlockRequest.getStatus() != SelfAssessmentUnlockRequestStatus.PENDING) {
            throw new RuntimeException("Unlock request is already resolved");
        }
        SelfAssessmentForm form = unlockRequest.getForm();
        if (form.getStatus() != SelfAssessmentFormStatus.PENDING_MANAGER_REVIEW) {
            throw new RuntimeException("Only forms pending manager review can be unlocked");
        }
        LocalDate managerDeadline = form.getManagerReviewDeadlineDate();
        if (managerDeadline == null) {
            throw new RuntimeException("Manager review deadline is required before unlocking");
        }

        User hrUser = findHrUser(hrUserId);
        String beforeSnapshot = snapshotAnswers(form);
        unlockRequest.setStatus(SelfAssessmentUnlockRequestStatus.UNLOCKED);
        unlockRequest.setResolvedBy(hrUser);
        unlockRequest.setHrReasonCode(request.reasonCode().name());
        unlockRequest.setHrReasonText(normalizeReasonText(request.reasonText()));
        unlockRequest.setUnlockDeadline(managerDeadline);
        unlockRequest.setResolvedAt(Instant.now());

        form.setStatus(SelfAssessmentFormStatus.REOPENED);
        form.setDeadlineDate(managerDeadline);
        form.setSubmittedDate(null);
        form.setAssessmentDate(null);
        form.setEmployeeSignatureId(null);
        form.setEmployeeSignatureDate(null);
        form.setUpdatedDate(Instant.now());
        SelfAssessmentForm savedForm = formRepository.save(form);
        SelfAssessmentUnlockRequest savedRequest = unlockRequestRepository.save(unlockRequest);

        auditService.record(
                AuditActionType.SELF_ASSESSMENT_FORM_UNLOCKED,
                AuditTargetType.SELF_ASSESSMENT_FORM,
                savedForm.getId(),
                hrUserId,
                null,
                "HR unlocked self-assessment form for employee resubmission",
                null,
                beforeSnapshot,
                snapshotAnswers(savedForm));

        sendEmployeeUnlockResolvedNotification(savedRequest, true);
        return toUnlockRequestDto(savedRequest);
    }

    @Transactional
    public SelfAssessmentUnlockRequestDto rejectSelfAssessmentRequest(
            Long requestId,
            SelfAssessmentUnlockRejectRequest request,
            Long hrUserId) {
        SelfAssessmentUnlockRequest unlockRequest = unlockRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Unlock request not found"));
        if (unlockRequest.getStatus() != SelfAssessmentUnlockRequestStatus.PENDING) {
            throw new RuntimeException("Unlock request is already resolved");
        }
        User hrUser = findHrUser(hrUserId);
        unlockRequest.setStatus(SelfAssessmentUnlockRequestStatus.REJECTED);
        unlockRequest.setResolvedBy(hrUser);
        unlockRequest.setHrReasonCode(request.reasonCode().name());
        unlockRequest.setHrReasonText(normalizeReasonText(request.reasonText()));
        unlockRequest.setResolvedAt(Instant.now());
        SelfAssessmentUnlockRequest saved = unlockRequestRepository.save(unlockRequest);

        auditService.record(
                AuditActionType.SELF_ASSESSMENT_FORM_UNLOCK_REJECTED,
                AuditTargetType.SELF_ASSESSMENT_FORM,
                saved.getForm().getId(),
                hrUserId,
                null,
                "HR rejected self-assessment unlock request",
                null,
                snapshotAnswers(saved.getForm()),
                snapshotAnswers(saved.getForm()));

        sendEmployeeUnlockResolvedNotification(saved, false);
        return toUnlockRequestDto(saved);
    }

    @Transactional
    public void createDueTomorrowNotifications() {
        ReviewCycle activeCycle = getActiveCycle();
        if (activeCycle == null) return;

        LocalDate tomorrow = LocalDate.now().plusDays(1);
        for (SelfAssessmentForm form : formRepository.findByCycleOrderByCreatedDateDesc(activeCycle)) {
            if (!tomorrow.equals(form.getDeadlineDate()) || form.getStatus() != SelfAssessmentFormStatus.DRAFT) {
                continue;
            }
            Employee emp = form.getEmployee();
            if (emp.getUserAccount() == null) {
                continue;
            }
            String message = "Your saved self-assessment draft is due tomorrow";
            String source = "SELF_ASSESSMENT_FORM";
            Optional<Notification> existingNotif = notificationRepository.findByRecipientAndSourceAndMessageStartingWith(
                    emp.getUserAccount(), source, "Your saved self-assessment draft");
            if (existingNotif.isPresent()) {
                continue;
            }
            notificationService.send(emp.getUserAccount(), "Self-Assessment Reminder", message, source);
        }
    }

    private SelfAssessmentForm getOrCreateForm(Employee employee) {
        ReviewCycle activeCycle = getActiveCycle();
        if (activeCycle == null) {
            throw new RuntimeException("No active cycle found");
        }

        Optional<SelfAssessmentForm> existingForm = formRepository.findByEmployeeAndCycle(employee, activeCycle);

        if (existingForm.isPresent()) {
            SelfAssessmentForm form = existingForm.get();
            if (isAssignmentScheduledForFuture(form)) {
                throw new RuntimeException("Your self-assessment is scheduled to start on " + form.getStartDate() + ".");
            }
            if (normalizeOverdueDraftForm(form)) {
                throw new RuntimeException("Deadline has passed. Your draft was marked as not submitted.");
            }
            return form;
        }

        throw new RuntimeException("No self-assessment form has been assigned to you for the active cycle.");
    }

    private SelfAssessmentForm createAssignedDraftForm(
            Employee employee,
            SelfAssessmentFormTemplate template,
            ReviewCycle cycle,
            LocalDate startDate,
            LocalDate deadlineDate,
            LocalDate managerReviewDeadlineDate,
            Instant assignedAt,
            Long assignedBy) {
        SelfAssessmentForm form = new SelfAssessmentForm();
        form.setEmployee(employee);
        form.setTemplate(template);
        form.setCycle(cycle);
        form.setRatingSystem(SelfAssessmentRatingSystem.defaultIfNull(template.getRatingSystem()));
        form.setTenPointYesMinRating(resolveSavedTenPointYesMinRating(template.getTenPointYesMinRating()));
        form.setStartDate(startDate);
        form.setDeadlineDate(deadlineDate);
        form.setManagerReviewDeadlineDate(managerReviewDeadlineDate);
        form.setFinalApprovalDeadlineDate(cycle != null ? cycle.getEndDate() : managerReviewDeadlineDate);
        form.setAssignedAt(assignedAt);
        form.setAssignedBy(assignedBy);
        form.setStatus(SelfAssessmentFormStatus.DRAFT);
        form.setCreatedDate(assignedAt);

        List<SelfAssessmentFormTemplateQuestion> activeQuestions = template.getQuestions().stream()
                .filter(q -> q.getDeletedAt() == null)
                .sorted(Comparator.comparing(SelfAssessmentFormTemplateQuestion::getSortOrder))
                .collect(Collectors.toList());
        for (SelfAssessmentFormTemplateQuestion templateQuestion : activeQuestions) {
            SelfAssessmentFormAnswer answer = new SelfAssessmentFormAnswer();
            answer.setQuestionText(templateQuestion.getQuestionText());
            answer.setSortOrder(templateQuestion.getSortOrder());
            form.addAnswer(answer);
        }
        return form;
    }

    private enum AssignmentMode {
        ALL_EMPLOYEES,
        DEPARTMENTS,
        POSITIONS,
        HYBRID,
        SPECIFIC_EMPLOYEES
    }

    private AssignmentMode parseAssignmentMode(String value) {
        String normalized = value == null ? "" : value.trim().toUpperCase().replace('-', '_');
        return switch (normalized) {
            case "ALL_EMPLOYEES", "ALL" -> AssignmentMode.ALL_EMPLOYEES;
            case "SPECIFIC_DEPARTMENTS", "DEPARTMENTS", "DEPARTMENT" -> AssignmentMode.DEPARTMENTS;
            case "SPECIFIC_POSITIONS", "POSITIONS", "POSITION" -> AssignmentMode.POSITIONS;
            case "HYBRID" -> AssignmentMode.HYBRID;
            case "SPECIFIC_EMPLOYEES", "EMPLOYEE_NAMES", "EMPLOYEES" -> AssignmentMode.SPECIFIC_EMPLOYEES;
            default -> throw new RuntimeException("Invalid assignment mode");
        };
    }

    private boolean isManualTimeline(String value) {
        return value != null && "MANUAL".equalsIgnoreCase(value.trim());
    }

    private boolean isManualTemplate(SelfAssessmentFormTemplate template) {
        return template.getReviewCycle() == null
                && template.getManualStartDate() != null
                && template.getManualEndDate() != null;
    }

    private void validateManualTemplateDates(LocalDate manualStartDate, LocalDate manualEndDate) {
        if (manualStartDate == null || manualEndDate == null) {
            throw new RuntimeException("Manual start date and end date are required");
        }
        if (manualStartDate.isAfter(manualEndDate)) {
            throw new RuntimeException("Manual end date cannot be earlier than the start date");
        }
    }

    private void validateManualAssignmentTimeline(SelfAssessmentAssignmentRequest request) {
        validateManualTemplateDates(request.manualStartDate(), request.manualEndDate());
        validateManualAssignmentDates(
                request.startDate(),
                request.deadlineDate(),
                request.managerReviewDeadlineDate(),
                request.manualStartDate(),
                request.manualEndDate());
    }

    private void validateManualPreviewTimeline(SelfAssessmentAssignmentPreviewRequest request) {
        validateManualTemplateDates(request.manualStartDate(), request.manualEndDate());
        validateManualAssignmentDates(
                request.manualStartDate(),
                request.deadlineDate(),
                request.managerReviewDeadlineDate(),
                request.manualStartDate(),
                request.manualEndDate());
    }

    private void validateManualAssignmentDates(
            LocalDate startDate,
            LocalDate deadlineDate,
            LocalDate managerReviewDeadlineDate,
            LocalDate manualStartDate,
            LocalDate manualEndDate) {
        if (startDate == null || deadlineDate == null || managerReviewDeadlineDate == null) {
            throw new RuntimeException("Start date, employee deadline, and manager review deadlines are required");
        }
        if (startDate.isAfter(deadlineDate)) {
            throw new RuntimeException("Employee deadline cannot be earlier than the start date.");
        }
        if (deadlineDate.isAfter(managerReviewDeadlineDate)) {
            throw new RuntimeException("Manager review deadline cannot be earlier than the employee deadline.");
        }
        if (!startDate.equals(manualStartDate)
                || !deadlineDate.equals(manualEndDate)
                || !managerReviewDeadlineDate.equals(manualEndDate)) {
            throw new RuntimeException("Manual assignment dates must match the selected manual template timeline");
        }
    }

    private SelfAssessmentRatingSystem parseRatingSystem(String value) {
        if (value == null || value.trim().isBlank()) {
            return SelfAssessmentRatingSystem.FIVE_POINT;
        }
        try {
            return SelfAssessmentRatingSystem.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Invalid rating system");
        }
    }

    private SelfAssessmentRatingSystem resolveTemplateRatingSystem(String requestValue) {
        if (requestValue != null && !requestValue.trim().isBlank()) {
            return parseRatingSystem(requestValue);
        }
        return SelfAssessmentRatingSystem.defaultIfNull(getOrCreateSettings().getRatingSystem());
    }

    private int parseTenPointYesMinRating(Integer value) {
        SelfAssessmentRatingSystem.validateTenPointYesMinRating(value);
        return SelfAssessmentRatingSystem.normalizeTenPointYesMinRating(value);
    }

    private int resolveTemplateTenPointYesMinRating(Integer requestValue) {
        if (requestValue != null) {
            return parseTenPointYesMinRating(requestValue);
        }
        return resolveSavedTenPointYesMinRating(getOrCreateSettings().getTenPointYesMinRating());
    }

    private int resolveSavedTenPointYesMinRating(Integer value) {
        return parseTenPointYesMinRating(value);
    }

    private SelfAssessmentSettings getOrCreateSettings() {
        return settingsRepository.findById(SelfAssessmentSettings.SINGLETON_ID)
                .orElseGet(() -> {
                    SelfAssessmentSettings settings = new SelfAssessmentSettings();
                    settings.setId(SelfAssessmentSettings.SINGLETON_ID);
                    settings.setRatingSystem(SelfAssessmentRatingSystem.FIVE_POINT);
                    settings.setTenPointYesMinRating(SelfAssessmentRatingSystem.DEFAULT_TEN_POINT_YES_MIN_RATING);
                    return settingsRepository.save(settings);
                });
    }

    private SelfAssessmentSettingsDto toSettingsDto(SelfAssessmentSettings settings) {
        boolean editable = !isRatingSystemLocked();
        return new SelfAssessmentSettingsDto(
                SelfAssessmentRatingSystem.defaultIfNull(settings.getRatingSystem()).name(),
                resolveSavedTenPointYesMinRating(settings.getTenPointYesMinRating()),
                editable,
                editable ? null : getRatingSystemLockReason());
    }

    private boolean isRatingSystemLocked() {
        return false;
    }

    private String getRatingSystemLockReason() {
        return "Templates already assigned to a deadline keep their existing rating scale.";
    }

    private void syncUnassignedTemplatesInActiveCycle(
            SelfAssessmentRatingSystem ratingSystem,
            Integer tenPointYesMinRating,
            Long userId) {
        ReviewCycle activeCycle = reviewCycleService.getActiveSubmissionCycle();
        if (activeCycle == null) {
            return;
        }

        List<SelfAssessmentFormTemplate> templates = templateRepository.findActiveByReviewCycleId(activeCycle.getId());
        if (templates.isEmpty()) {
            return;
        }

        Instant now = Instant.now();
        boolean changed = false;
        for (SelfAssessmentFormTemplate template : templates) {
            if (formRepository.existsByTemplate(template)) {
                continue;
            }
            SelfAssessmentRatingSystem current = SelfAssessmentRatingSystem.defaultIfNull(template.getRatingSystem());
            int currentTenPointYesMinRating = resolveSavedTenPointYesMinRating(template.getTenPointYesMinRating());
            int targetTenPointYesMinRating = resolveSavedTenPointYesMinRating(tenPointYesMinRating);
            if (current != ratingSystem || currentTenPointYesMinRating != targetTenPointYesMinRating) {
                template.setRatingSystem(ratingSystem);
                template.setTenPointYesMinRating(targetTenPointYesMinRating);
                template.setUpdatedBy(userId);
                template.setUpdatedOn(now);
                changed = true;
            }
        }
        if (changed) {
            templateRepository.saveAll(templates);
        }
    }

    private void assertTemplateEditable(SelfAssessmentFormTemplate template) {
        if (formRepository.existsByTemplate(template)) {
            throw new RuntimeException("Template cannot be edited after forms have been assigned");
        }
    }

    private void validateAssignmentSelections(AssignmentMode mode, List<Long> departmentIds, List<Long> positionIds, List<Long> employeeIds) {
        boolean hasDepartments = departmentIds != null && departmentIds.stream().anyMatch(id -> id != null && id > 0);
        boolean hasPositions = positionIds != null && positionIds.stream().anyMatch(id -> id != null && id > 0);
        boolean hasEmployees = employeeIds != null && employeeIds.stream().anyMatch(id -> id != null && id > 0);
        if ((mode == AssignmentMode.DEPARTMENTS || mode == AssignmentMode.HYBRID) && !hasDepartments) {
            throw new RuntimeException("Please select at least one department");
        }
        if ((mode == AssignmentMode.POSITIONS || mode == AssignmentMode.HYBRID) && !hasPositions) {
            throw new RuntimeException("Please select at least one position");
        }
        if (mode == AssignmentMode.SPECIFIC_EMPLOYEES && !hasEmployees) {
            throw new RuntimeException("Please select at least one employee");
        }
    }

    private void validateAssignmentDeadlines(
            LocalDate assignmentStartDate,
            LocalDate employeeDeadline,
            LocalDate managerDeadline,
            ReviewCycle activeCycle) {
        if (assignmentStartDate == null || employeeDeadline == null || managerDeadline == null) {
            throw new RuntimeException("Start date, employee deadline, and manager review deadlines are required");
        }
        LocalDate cycleEnd = activeCycle.getEndDate();
        if (cycleEnd == null) {
            throw new RuntimeException("Active review cycle has no end date");
        }
        if (assignmentStartDate.isAfter(employeeDeadline)) {
            throw new RuntimeException("Employee deadline cannot be earlier than the start date.");
        }
        if (employeeDeadline.isAfter(managerDeadline)) {
            throw new RuntimeException("Manager review deadline cannot be earlier than the employee deadline.");
        }
        if (managerDeadline.isAfter(cycleEnd)) {
            throw new RuntimeException("Manager review deadline cannot be after the review cycle end date.");
        }
        validateDateWithinActiveCycle(assignmentStartDate, "Start date", activeCycle);
        validateDateWithinActiveCycle(employeeDeadline, "Employee deadline", activeCycle);
        validateDateWithinActiveCycle(managerDeadline, "Manager review deadline", activeCycle);
    }

    private boolean isAssignmentScheduledForFuture(SelfAssessmentForm form) {
        return form.getStartDate() != null && LocalDate.now().isBefore(form.getStartDate());
    }

    private LocalDate resolveFinalApprovalDeadlineDate(SelfAssessmentForm form) {
        if (form.getCycle() != null && form.getCycle().getEndDate() != null) {
            return form.getCycle().getEndDate();
        }
        return form.getFinalApprovalDeadlineDate();
    }

    private void validateDateWithinActiveCycle(LocalDate date, String label, ReviewCycle activeCycle) {
        if (date.isBefore(activeCycle.getStartDate()) || date.isAfter(activeCycle.getEndDate())) {
            throw new RuntimeException(label + " must be within the active cycle");
        }
    }

    private Set<Long> toIdSet(List<Long> ids) {
        if (ids == null) {
            return Set.of();
        }
        return ids.stream()
                .filter(id -> id != null && id > 0)
                .collect(Collectors.toSet());
    }

    private boolean matchesAssignmentMode(
            Employee employee,
            AssignmentMode mode,
            Set<Long> departmentIds,
            Set<Long> positionIds,
            Set<Long> employeeIds) {
        Long departmentId = getEmployeeDepartmentId(employee);
        Long positionId = getEmployeePositionId(employee);
        return switch (mode) {
            case ALL_EMPLOYEES -> true;
            case DEPARTMENTS -> departmentId != null && departmentIds.contains(departmentId);
            case POSITIONS -> positionId != null && positionIds.contains(positionId);
            case HYBRID -> departmentId != null && positionId != null
                    && departmentIds.contains(departmentId)
                    && positionIds.contains(positionId);
            case SPECIFIC_EMPLOYEES ->
                    employee.getId() != null && employeeIds.contains(employee.getId());
        };
    }

    private void updateAnswers(SelfAssessmentForm form, List<AnswerRequest> answerRequests) {
        if (answerRequests == null) return;

        SelfAssessmentRatingSystem ratingSystem = SelfAssessmentRatingSystem.defaultIfNull(form.getRatingSystem());
        int tenPointYesMinRating = resolveSavedTenPointYesMinRating(form.getTenPointYesMinRating());
        for (AnswerRequest ar : answerRequests) {
            for (SelfAssessmentFormAnswer answer : form.getAnswers()) {
                if (answer.getId().equals(ar.id())) {
                    String effectiveYesNo = ar.yesNoAnswer() != null ? ar.yesNoAnswer() : answer.getYesNoAnswer();
                    Integer effectiveRating = ar.rating() != null ? ar.rating() : answer.getRating();
                    if ((effectiveRating != null && effectiveYesNo == null)
                            || !ratingSystem.isValidYesNo(effectiveYesNo)
                            || !ratingSystem.isValidRating(effectiveYesNo, effectiveRating, tenPointYesMinRating)) {
                        throw new RuntimeException("Rating does not match the form rating system");
                    }
                    if (ar.yesNoAnswer() != null) {
                        answer.setYesNoAnswer(ar.yesNoAnswer());
                    }
                    if (ar.rating() != null || ar.yesNoAnswer() != null) {
                        answer.setRating(ar.rating());
                    }
                    if (ar.remarks() != null) {
                        answer.setRemarks(ar.remarks());
                    }
                    break;
                }
            }
        }
    }

    private void calculateScore(SelfAssessmentForm form) {
        int totalPoints = form.getAnswers().stream()
                .filter(a -> a.getRating() != null)
                .mapToInt(SelfAssessmentFormAnswer::getRating)
                .sum();
        int numQuestions = form.getAnswers().size();
        int maxRating = SelfAssessmentRatingSystem.defaultIfNull(form.getRatingSystem()).getMaxRating();
        double score = numQuestions > 0 ? ((double) totalPoints / (numQuestions * maxRating)) * 100 : 0.0;

        form.setTotalScore(score);
        form.setRatingCategory(getRatingCategory(score));
    }

    private String getRatingCategory(double score) {
        if (score >= 86) return "Outstanding";
        if (score >= 71) return "Good";
        if (score >= 60) return "Meet Requirement";
        if (score >= 40) return "Need Improvement";
        return "Unsatisfactory";
    }

    private boolean isDeadlinePassed(SelfAssessmentForm form) {
        LocalDate today = LocalDate.now();
        LocalDate deadline = form.getDeadlineDate();
        boolean employeeDeadlinePassed = deadline != null && today.isAfter(deadline);
        LocalDate cycleEndDate = form.getCycle() != null ? form.getCycle().getEndDate() : null;
        boolean cycleEnded = cycleEndDate != null && today.isAfter(cycleEndDate);
        return employeeDeadlinePassed || cycleEnded;
    }

    private boolean normalizeOverdueDraftForm(SelfAssessmentForm form) {
        if (form == null || form.getStatus() != SelfAssessmentFormStatus.DRAFT || !isDeadlinePassed(form)) {
            return false;
        }

        boolean changed = false;
        if (form.getStatus() != SelfAssessmentFormStatus.NOT_SUBMITTED) {
            form.setStatus(SelfAssessmentFormStatus.NOT_SUBMITTED);
            changed = true;
        }
        if (!Double.valueOf(0.0).equals(form.getFinalApprovedTotalScore())) {
            form.setFinalApprovedTotalScore(0.0);
            changed = true;
        }
        if (!Double.valueOf(0.0).equals(form.getTotalScore())) {
            form.setTotalScore(0.0);
            changed = true;
        }
        if (!"Unsatisfactory".equals(form.getRatingCategory())) {
            form.setRatingCategory("Unsatisfactory");
            changed = true;
        }
        if (changed) {
            form.setUpdatedDate(Instant.now());
            formRepository.save(form);
        }
        return changed;
    }

    /** Ensures persisted NOT_SUBMITTED rows always expose the zero-score penalty in history. */
    private void normalizeNotSubmittedForm(SelfAssessmentForm form) {
        if (form == null || form.getStatus() != SelfAssessmentFormStatus.NOT_SUBMITTED) {
            return;
        }

        boolean changed = false;
        if (!Double.valueOf(0.0).equals(form.getFinalApprovedTotalScore())) {
            form.setFinalApprovedTotalScore(0.0);
            changed = true;
        }
        if (!Double.valueOf(0.0).equals(form.getTotalScore())) {
            form.setTotalScore(0.0);
            changed = true;
        }
        if (!"Unsatisfactory".equals(form.getRatingCategory())) {
            form.setRatingCategory("Unsatisfactory");
            changed = true;
        }
        if (changed) {
            form.setUpdatedDate(Instant.now());
            formRepository.save(form);
        }
    }

    private ReviewCycle getActiveCycle() {
        ReviewCycle activeCycle = reviewCycleService.getActiveSubmissionCycle();
        if (activeCycle != null) {
            return activeCycle;
        }
        reviewCycleService.generateCurrentYear();
        return reviewCycleService.getActiveSubmissionCycle();
    }

    private ReviewCycle requireActiveCycle() {
        ReviewCycle activeCycle = reviewCycleService.getActiveSubmissionCycle();
        if (activeCycle == null) {
            throw new RuntimeException("No active employee-submission review cycle found");
        }
        return activeCycle;
    }

    /**
     * Prefer a template scoped to the given cycle; fall back to legacy templates with no review cycle.
     */
    private Optional<SelfAssessmentFormTemplate> findActiveTemplateForDepartmentPositionAndCycle(
            Long departmentId, Long positionId, ReviewCycle cycle) {
        if (cycle == null) {
            return Optional.empty();
        }
        Optional<SelfAssessmentFormTemplate> forCycle = templateRepository.findActiveByDepartmentAndPositionAndReviewCycleId(
                departmentId, positionId, cycle.getId());
        if (forCycle.isPresent()) {
            return forCycle;
        }
        return templateRepository.findActiveByDepartmentAndPositionWithNullReviewCycle(departmentId, positionId);
    }

    private CycleInfoDto toCycleInfo(ReviewCycle cycle) {
        return new CycleInfoDto(
                cycle.getId(),
                cycle.getName(),
                cycle.getCode(),
                cycle.getStartDate(),
                cycle.getEndDate());
    }

    private boolean isPermanentEmployee(Employee employee) {
        return employee != null
                && employee.getStaffType() != null
                && employee.getStaffType().getId() == StaffTypes.PERMANENT;
    }

    private boolean canManagerReview(SelfAssessmentForm form, Employee manager) {
        Employee subject = form.getEmployee();
        if (subject.getManager() != null && subject.getManager().getId().equals(manager.getId())) {
            return true;
        }
        return subject.getDepartment().getManagerId() != null
                && subject.getDepartment().getManagerId().equals(manager.getId());
    }

    private boolean isManagerOwnedForm(SelfAssessmentForm form) {
        return form != null && isRole(form.getEmployee(), 2L);
    }

    private boolean isRole(Employee employee, Long roleId) {
        if (employee == null || roleId == null) {
            return false;
        }
        if (employee.getUserAccount() != null
                && employee.getUserAccount().getRole() != null
                && roleId.equals(employee.getUserAccount().getRole().getId())) {
            return true;
        }
        if (employee.getId() == null) {
            return false;
        }
        return userRepository.findByEmployee_Id(employee.getId())
                .map(User::getRole)
                .map(Role::getId)
                .map(roleId::equals)
                .orElse(false);
    }

    private Long resolveEmployeeRoleId(Employee employee) {
        if (employee == null) {
            return null;
        }
        if (employee.getUserAccount() != null && employee.getUserAccount().getRole() != null) {
            return employee.getUserAccount().getRole().getId();
        }
        if (employee.getId() == null) {
            return null;
        }
        return userRepository.findByEmployee_Id(employee.getId())
                .map(User::getRole)
                .map(Role::getId)
                .orElse(null);
    }

    private boolean isPostSubmitStatus(SelfAssessmentFormStatus status) {
        return status == SelfAssessmentFormStatus.SUBMITTED
                || status == SelfAssessmentFormStatus.MANAGER_REVIEWED
                || status == SelfAssessmentFormStatus.APPROVED
                || status == SelfAssessmentFormStatus.PENDING_MANAGER_REVIEW
                || status == SelfAssessmentFormStatus.PENDING_EMPLOYEE_REVIEW
                || status == SelfAssessmentFormStatus.PENDING_EMPLOYEE_RETAKE
                || status == SelfAssessmentFormStatus.PENDING_RETAKE_MANAGER_REVIEW
                || status == SelfAssessmentFormStatus.PENDING_FINAL_APPROVAL
                || status == SelfAssessmentFormStatus.PENDING_HR_CALIBRATION_REVIEW
                || status == SelfAssessmentFormStatus.FINALIZED_LOCKED;
    }

    private void calculateManagerRevisedScore(SelfAssessmentForm form) {
        int numQuestions = form.getAnswers().size();
        if (numQuestions == 0) {
            form.setManagerRevisedTotalScore(0.0);
            return;
        }
        int maxRating = SelfAssessmentRatingSystem.defaultIfNull(form.getRatingSystem()).getMaxRating();
        int totalPoints = form.getAnswers().stream()
                .mapToInt(a -> {
                    if (a.getManagerProposedRating() != null) return a.getManagerProposedRating();
                    return a.getRating() != null ? a.getRating() : 0;
                })
                .sum();
        form.setManagerRevisedTotalScore(((double) totalPoints / (numQuestions * maxRating)) * 100);
    }

    private void calculateFinalApprovedScore(SelfAssessmentForm form) {
        int numQuestions = form.getAnswers().size();
        if (numQuestions == 0) {
            form.setFinalApprovedTotalScore(0.0);
            return;
        }
        int maxRating = SelfAssessmentRatingSystem.defaultIfNull(form.getRatingSystem()).getMaxRating();
        int totalPoints = form.getAnswers().stream()
                .mapToInt(a -> {
                    if (a.getFinalApprovedRating() != null) return a.getFinalApprovedRating();
                    if (a.getManagerProposedRating() != null) return a.getManagerProposedRating();
                    return a.getRating() != null ? a.getRating() : 0;
                })
                .sum();
        form.setFinalApprovedTotalScore(((double) totalPoints / (numQuestions * maxRating)) * 100);
    }

    private void sendManagerReviewNotificationsNew(
            SelfAssessmentForm form,
            boolean scoreChanged,
            boolean hasManagerAdjustments) {
        Employee employee = form.getEmployee();
        if (employee != null && hasActiveUserAccount(employee)) {
            String detail = hasManagerAdjustments
                    ? (scoreChanged
                            ? "updated one or more scores"
                            : "added proposed adjustments")
                    : "completed the review";
            notificationService.send(
                    employee.getUserAccount(),
                    "Manager Review Completed",
                    "Your manager has reviewed your self-assessment and " + detail + ". "
                            + "Please review the updated evaluation, including any manager comments, "
                            + "before your performance discussion.",
                    "SELF_ASSESSMENT_FORM",
                    form.getId());
        }
    }

    private void sendEmployeeRetakeNotification(SelfAssessmentForm form) {
        Employee employee = form.getEmployee();
        resolveActiveEmployeeUser(employee).ifPresent(user -> notificationService.send(
                user,
                "Self-Assessment Retake Requested",
                "Your manager requested a retake for selected questions on "
                        + resolveFormDisplayTitle(form) + ". Please update only the warned questions.",
                "SELF_ASSESSMENT_FORM",
                form.getId()));
    }

    private void sendManagerSelfAssessmentRetakeNotification(SelfAssessmentForm form) {
        Employee employee = form.getEmployee();
        resolveActiveEmployeeUser(employee).ifPresent(user -> notificationService.send(
                user,
                "Self-Assessment Retake Requested",
                "HR requested a retake for selected questions on "
                        + resolveFormDisplayTitle(form) + ". Please update only the warned questions.",
                "SELF_ASSESSMENT_FORM",
                form.getId()));
    }

    private Optional<User> resolveActiveEmployeeUser(Employee employee) {
        if (employee == null || employee.getId() == null) {
            return Optional.empty();
        }
        if (hasActiveUserAccount(employee)) {
            return Optional.of(employee.getUserAccount());
        }
        return userRepository.findByEmployee_Id(employee.getId()).filter(User::isActive);
    }

    private void sendManagerRetakeSubmittedNotification(SelfAssessmentForm form) {
        Employee employee = form.getEmployee();
        resolveManagerRecipient(employee)
                .ifPresent(manager -> notificationService.send(
                        manager.getUserAccount(),
                        "Self-Assessment Retake Submitted",
                        (employee != null ? employee.getEmployeeName() : "An employee")
                                + " submitted retake answers for "
                                + resolveFormDisplayTitle(form) + ".",
                        "SELF_ASSESSMENT_FORM",
                        form.getId()));
    }

    private void sendHrManagerSelfAssessmentSubmittedNotification(SelfAssessmentForm form) {
        Employee employee = form.getEmployee();
        userRepository.findByRole_IdAndActiveTrue(1L).forEach(hrUser -> notificationService.send(
                hrUser,
                "Manager Self-Assessment Pending Final Approval",
                (employee != null ? employee.getEmployeeName() : "A manager")
                        + " submitted "
                        + resolveFormDisplayTitle(form)
                        + ". Final HR approval is required.",
                "SELF_ASSESSMENT_FORM",
                form.getId()));
    }

    private void sendHrManagerSelfAssessmentRetakeSubmittedNotification(SelfAssessmentForm form) {
        Employee employee = form.getEmployee();
        userRepository.findByRole_IdAndActiveTrue(1L).forEach(hrUser -> notificationService.send(
                hrUser,
                "Manager Self-Assessment Retake Submitted",
                (employee != null ? employee.getEmployeeName() : "A manager")
                        + " submitted retake answers for "
                        + resolveFormDisplayTitle(form)
                        + ". Final HR approval is required.",
                "SELF_ASSESSMENT_FORM",
                form.getId()));
    }

    /**
     * @param managerConcurrenceNoScoreChanges when true, HR is notified because the manager endorsed the
     *                                           self-assessment without changing scores (employee step skipped).
     */
    private void sendHrFinalApprovalNotification(SelfAssessmentForm form, boolean managerConcurrenceNoScoreChanges) {
        Employee employee = form.getEmployee();
        User reviewedEmployeeUser = employee != null ? employee.getUserAccount() : null;
        String body = managerConcurrenceNoScoreChanges
                ? (employee != null ? employee.getEmployeeName() : "An employee")
                        + "'s self-assessment for "
                        + resolveFormDisplayTitle(form)
                        + ": manager completed review with no score changes. Final HR approval is required."
                : (employee != null ? employee.getEmployeeName() : "An employee")
                        + " has acknowledged the manager review for "
                        + resolveFormDisplayTitle(form) + ". Final HR approval is required.";
        userRepository.findByRole_IdAndActiveTrue(1L).stream()
                .filter(hrUser -> reviewedEmployeeUser == null || !hrUser.getId().equals(reviewedEmployeeUser.getId()))
                .forEach(hrUser -> notificationService.send(
                        hrUser,
                        "Self-Assessment Pending Final Approval",
                        body,
                        "SELF_ASSESSMENT_FORM",
                        form.getId()));
    }

    private void sendHrDisputeNotification(SelfAssessmentForm form) {
        Employee employee = form.getEmployee();
        userRepository.findByRole_IdAndActiveTrue(1L).forEach(hrUser ->
                notificationService.send(
                        hrUser,
                        "Self-Assessment Disputed",
                        (employee != null ? employee.getEmployeeName() : "An employee")
                                + " has disputed the manager review on "
                                + resolveFormDisplayTitle(form) + ". Reason: "
                                + form.getEmployeeDisputeReason(),
                        "SELF_ASSESSMENT_FORM",
                        form.getId()));
    }

    private void sendManagerDisputeReturnNotification(SelfAssessmentForm form, String hrReason) {
        Employee employee = form.getEmployee();
        resolveManagerRecipient(employee)
                .ifPresent(manager -> notificationService.send(
                        manager.getUserAccount(),
                        "Self-Assessment Review Returned",
                        "Manager revision is required for "
                                + (employee != null ? employee.getEmployeeName() + "'s " : "")
                                + resolveFormDisplayTitle(form)
                                + ". Employee dispute reason: "
                                + nullToDash(form.getEmployeeDisputeReason())
                                + ". HR return reason: "
                                + hrReason,
                        "SELF_ASSESSMENT_FORM",
                        form.getId()));
    }

    private void sendManagerSubmissionNotification(Employee employee, SelfAssessmentForm form) {
        resolveManagerRecipient(employee)
                .ifPresent(manager -> notificationService.send(
                        manager.getUserAccount(),
                        "Self-Assessment Submitted",
                        "Employee " + employee.getEmployeeName() + " submitted "
                                + resolveFormDisplayTitle(form) + " for your review.",
                        "SELF_ASSESSMENT_FORM",
                        form.getId()));
    }

    private void sendHrUnlockRequestedNotification(SelfAssessmentUnlockRequest request) {
        SelfAssessmentForm form = request.getForm();
        Employee employee = request.getEmployee();
        userRepository.findByRole_IdAndActiveTrue(1L).forEach(hrUser -> notificationService.send(
                hrUser,
                "Self-Assessment Unlock Requested",
                (employee != null ? employee.getEmployeeName() : "An employee")
                        + " requested HR unlock for "
                        + resolveFormDisplayTitle(form) + ". Reason: "
                        + formatUnlockRequestReason(request),
                "SELF_ASSESSMENT_FORM",
                form.getId()));
    }

    private void sendEmployeeUnlockResolvedNotification(SelfAssessmentUnlockRequest request, boolean unlocked) {
        Employee employee = request.getEmployee();
        resolveActiveEmployeeUser(employee).ifPresent(user -> notificationService.send(
                user,
                unlocked ? "Self-Assessment Unlocked" : "Self-Assessment Unlock Rejected",
                unlocked
                        ? "HR unlocked your self-assessment. Please resubmit by "
                                + request.getUnlockDeadline().format(NOTIFICATION_DEADLINE_FORMAT) + "."
                        : "HR rejected your self-assessment unlock request.",
                "SELF_ASSESSMENT_FORM",
                request.getForm().getId()));
    }

    private Optional<Employee> resolveManagerRecipient(Employee employee) {
        if (employee == null) {
            return Optional.empty();
        }

        Employee directManager = employee.getManager();
        if (directManager != null) {
            return hasActiveUserAccount(directManager) ? Optional.of(directManager) : Optional.empty();
        }

        Long departmentManagerId = employee.getDepartment() != null
                ? employee.getDepartment().getManagerId()
                : null;
        if (departmentManagerId == null) {
            return Optional.empty();
        }

        return employeeRepository.findById(departmentManagerId)
                .filter(this::hasActiveUserAccount);
    }

    private boolean hasActiveUserAccount(Employee employee) {
        return employee != null
                && employee.getUserAccount() != null
                && employee.getUserAccount().isActive();
    }

    // private QuestionDto
    // mapTemplateQuestionToDto(SelfAssessmentFormTemplateQuestion q) {
    // return mapTemplateQuestionToDto(q, null, null);
    // }

    private QuestionDto mapTemplateQuestionToDto(SelfAssessmentFormTemplateQuestion q, Long currentUserId, Long currentRoleId) {
        Long createdByRoleId = getUserRoleId(q.getCreatedBy());
        boolean isManagerAdded = createdByRoleId != null && createdByRoleId == 2L;
        boolean isHr = currentRoleId != null && currentRoleId == 1L;
        boolean isManagerOwner = currentRoleId != null
                && currentRoleId == 2L
                && currentUserId != null
                && currentUserId.equals(q.getCreatedBy());
        boolean canEdit = isHr || isManagerOwner;
        boolean canDeactivate = isHr || isManagerOwner;
        boolean canHighlight = isHr && isManagerAdded && q.getDeletedAt() == null;

        return new QuestionDto(
                q.getId(),
                q.getQuestionText(),
                q.getSortOrder(),
                q.getCreatedBy(),
                createdByRoleId,
                isManagerAdded,
                canEdit,
                canDeactivate,
                canHighlight,
                q.getCreatedOn(),
                q.getDeletedAt(),
                q.getDeletedBy());
    }

    private QuestionDto mapCopiedTemplateQuestionToDto(CopiedSelfAssessmentFormTemplateQuestion q) {
        Long createdByRoleId = getUserRoleId(q.getCreatedBy());
        boolean isManagerAdded = createdByRoleId != null && createdByRoleId == 2L;
        return new QuestionDto(
                q.getId(),
                q.getQuestionText(),
                q.getSortOrder(),
                q.getCreatedBy(),
                createdByRoleId,
                isManagerAdded,
                true,
                true,
                false,
                q.getCreatedOn(),
                q.getDeletedAt(),
                q.getDeletedBy());
    }

    private CopiedSelfAssessmentFormTemplateDto toCopiedTemplateDto(CopiedSelfAssessmentFormTemplate copied) {
        List<QuestionDto> questions = copied.getQuestions().stream()
                .filter(q -> q.getDeletedAt() == null)
                .sorted(Comparator.comparing(CopiedSelfAssessmentFormTemplateQuestion::getSortOrder))
                .map(this::mapCopiedTemplateQuestionToDto)
                .collect(Collectors.toList());
        List<QuestionDto> deletedQuestions = copied.getQuestions().stream()
                .filter(q -> q.getDeletedAt() != null)
                .sorted(Comparator
                        .comparing(CopiedSelfAssessmentFormTemplateQuestion::getDeletedAt)
                        .reversed()
                        .thenComparing(CopiedSelfAssessmentFormTemplateQuestion::getSortOrder))
                .map(this::mapCopiedTemplateQuestionToDto)
                .collect(Collectors.toList());

        SelfAssessmentFormTemplate source = copied.getSourceTemplate();
        Long departmentId = copied.getDepartmentId();
        Long positionId = copied.getPositionId();
        if (departmentId == null && source != null && source.getDepartment() != null) {
            departmentId = source.getDepartment().getId();
        }
        if (positionId == null && source != null && source.getPosition() != null) {
            positionId = source.getPosition().getId();
        }

        String departmentName = null;
        String positionName = null;
        if (source != null && source.getDepartment() != null && departmentId != null
                && departmentId.equals(source.getDepartment().getId())) {
            departmentName = source.getDepartment().getName();
        }
        if (source != null && source.getPosition() != null && positionId != null
                && positionId.equals(source.getPosition().getId())) {
            positionName = source.getPosition().getName();
        }
        if (departmentName == null && departmentId != null) {
            departmentName = departmentRepository.findById(departmentId).map(Department::getName).orElse(null);
        }
        if (positionName == null && positionId != null) {
            positionName = positionRepository.findById(positionId).map(Position::getName).orElse(null);
        }

        return new CopiedSelfAssessmentFormTemplateDto(
                copied.getId(),
                source != null ? source.getId() : null,
                copied.getTitle(),
                SelfAssessmentRatingSystem.defaultIfNull(copied.getRatingSystem()).name(),
                resolveSavedTenPointYesMinRating(copied.getTenPointYesMinRating()),
                departmentId,
                positionId,
                departmentName,
                positionName,
                questions,
                deletedQuestions,
                copied.getCreatedOn(),
                copied.getCreatedBy());
    }

    private SelfAssessmentFormTemplateDto toTemplateDto(SelfAssessmentFormTemplate template) {
        return toTemplateDto(template, null, null);
    }

    private SelfAssessmentFormTemplateDto toTemplateDto(SelfAssessmentFormTemplate template, Long currentUserId, Long currentRoleId) {
        List<QuestionDto> questions = template.getQuestions().stream()
                .filter(q -> q.getDeletedAt() == null)
                .sorted(Comparator.comparing(SelfAssessmentFormTemplateQuestion::getSortOrder))
                .map(q -> mapTemplateQuestionToDto(q, currentUserId, currentRoleId))
                .collect(Collectors.toList());
        List<QuestionDto> deletedQuestions = template.getQuestions().stream()
                .filter(q -> q.getDeletedAt() != null)
                .sorted(Comparator
                        .comparing(SelfAssessmentFormTemplateQuestion::getDeletedAt)
                        .reversed()
                        .thenComparing(SelfAssessmentFormTemplateQuestion::getSortOrder))
                .map(q -> mapTemplateQuestionToDto(q, currentUserId, currentRoleId))
                .collect(Collectors.toList());

        return new SelfAssessmentFormTemplateDto(
                template.getId(),
                template.getTitle(),
                template.getDepartment().getId(),
                template.getDepartment().getName(),
                template.getPosition().getId(),
                template.getPosition().getName(),
                template.getReviewCycle() != null ? template.getReviewCycle().getId() : null,
                template.getReviewCycle() != null ? template.getReviewCycle().getName() : null,
                isManualTemplate(template) ? "MANUAL" : "REVIEW_CYCLE",
                template.getManualStartDate(),
                template.getManualEndDate(),
                template.isActive(),
                SelfAssessmentRatingSystem.defaultIfNull(template.getRatingSystem()).name(),
                resolveSavedTenPointYesMinRating(template.getTenPointYesMinRating()),
                formRepository.existsByTemplate(template),
                formRepository.existsByTemplate(template),
                questions,
                deletedQuestions,
                template.getCreatedOn(),
                template.getCreatedBy()
        );
    }

    private Long getUserRoleId(Long userId) {
        if (userId == null) {
            return null;
        }
        return userRepository.findById(userId)
                .map(User::getRole)
                .map(Role::getId)
                .orElse(null);
    }

    private boolean isHrCreatedTemplate(SelfAssessmentFormTemplate template) {
        Long creatorRoleId = getUserRoleId(template.getCreatedBy());
        return creatorRoleId != null && creatorRoleId == 1L;
    }

    private void requireManagerReviewComments(String comments) {
        if (comments == null || comments.trim().isBlank()) {
            throw new RuntimeException("Manager comments are required");
        }
    }

    private void requireManagerTemplateAccess(SelfAssessmentFormTemplate template, Employee manager) {
        Long departmentId = getEmployeeDepartmentId(manager);
        if (departmentId == null) {
            throw new RuntimeException("Manager department not found");
        }
        if (!template.isActive()) {
            throw new RuntimeException("Template not found");
        }
        if (template.getDepartment() == null || !departmentId.equals(template.getDepartment().getId())) {
            throw new RuntimeException("Template not found");
        }
        if (!isHrCreatedTemplate(template)) {
            throw new RuntimeException("Template not found");
        }
    }

    private Long getEmployeeDepartmentId(Employee employee) {
        if (employee == null) {
            return null;
        }
        if (employee.getDepartment() != null) {
            return employee.getDepartment().getId();
        }
        if (employee.getDepartmentPosition() != null && employee.getDepartmentPosition().getDepartment() != null) {
            return employee.getDepartmentPosition().getDepartment().getId();
        }
        return null;
    }

    private Long getEmployeePositionId(Employee employee) {
        if (employee == null) {
            return null;
        }
        if (employee.getPosition() != null) {
            return employee.getPosition().getId();
        }
        if (employee.getDepartmentPosition() != null && employee.getDepartmentPosition().getPosition() != null) {
            return employee.getDepartmentPosition().getPosition().getId();
        }
        return null;
    }

    private static String resolveFormDisplayTitle(SelfAssessmentForm form) {
        if (form.getTemplate() != null) {
            String templateTitle = form.getTemplate().getTitle();
            if (templateTitle != null && !templateTitle.isBlank()) {
                return templateTitle;
            }
        }
        return "Self Assessment Form";
    }

    @Transactional
    public List<ScoreRecordDto> getScoreRecords(Employee employee, Long roleId) {
        if (roleId != null && roleId == 1L) {
            return getHrScoreRecords();
        }
        if (roleId != null && roleId == 2L) {
            return getManagerScoreRecords(employee);
        }
        if (roleId != null && (roleId == 3L || roleId == 4L)) {
            return getEmployeeScoreRecords(employee);
        }
        throw new RuntimeException("Unauthorized");
    }

    private List<ScoreRecordDto> getHrScoreRecords() {
        return formRepository.findAll().stream()
                .peek(this::normalizeOverdueDraftForm)
                .peek(this::normalizeNotSubmittedForm)
                .filter(f -> SCORE_RECORD_HISTORY_STATUSES.contains(f.getStatus()))
                .sorted(Comparator.comparing(SelfAssessmentForm::getCreatedDate, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toScoreRecordDto)
                .collect(Collectors.toList());
    }

    private List<ScoreRecordDto> getManagerScoreRecords(Employee manager) {
        List<SelfAssessmentForm> allForms = formRepository.findAll();
        return allForms.stream()
                .peek(this::normalizeOverdueDraftForm)
                .peek(this::normalizeNotSubmittedForm)
                .filter(f -> SCORE_RECORD_HISTORY_STATUSES.contains(f.getStatus()))
                .filter(f -> canManagerAccessForm(f, manager))
                .sorted(Comparator.comparing(SelfAssessmentForm::getCreatedDate, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toScoreRecordDto)
                .collect(Collectors.toList());
    }

    /** Employee history lists every status for their own forms (incl. draft / not started). */
    private List<ScoreRecordDto> getEmployeeScoreRecords(Employee employee) {
        return formRepository.findAll().stream()
                .peek(this::normalizeOverdueDraftForm)
                .peek(this::normalizeNotSubmittedForm)
                .filter(f -> isOwnForm(f, employee))
                .sorted(Comparator.comparing(SelfAssessmentForm::getCreatedDate, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toScoreRecordDto)
                .collect(Collectors.toList());
    }

    private boolean canManagerAccessForm(SelfAssessmentForm form, Employee manager) {
        if (form == null || manager == null) return false;
        Employee emp = form.getEmployee();
        if (emp == null) return false;
        Long managerId = manager.getId();
        if (managerId != null && managerId.equals(emp.getId())) return true;
        boolean isDirectReport = emp.getManager() != null && emp.getManager().getId().equals(managerId);
        boolean isDepartmentManaged = emp.getDepartment() != null
                && managerId.equals(emp.getDepartment().getManagerId());
        return isDirectReport || isDepartmentManaged;
    }

    private boolean isOwnForm(SelfAssessmentForm form, Employee employee) {
        return form != null
                && form.getEmployee() != null
                && employee != null
                && form.getEmployee().getId().equals(employee.getId());
    }

    private ScoreRecordDto toScoreRecordDto(SelfAssessmentForm form) {
        Employee emp = form.getEmployee();
        EmployeeInfoDto employeeInfo = new EmployeeInfoDto(
                emp.getId(),
                emp.getEmployeeId(),
                emp.getEmployeeName(),
                emp.getEmail(),
                emp.getDepartment() != null ? emp.getDepartment().getId() : null,
                emp.getDepartment() != null ? emp.getDepartment().getName() : null,
                emp.getDepartment() != null ? emp.getDepartment().getCode() : null,
                emp.getPosition() != null ? emp.getPosition().getId() : null,
                emp.getPosition() != null ? emp.getPosition().getName() : null,
                emp.getPosition() != null ? emp.getPosition().getCode() : null,
                resolveEmployeeRoleId(emp)
        );

        Double finalApprovedScore = form.getFinalApprovedTotalScore();
        String performance = form.getRatingCategory();
        if (form.getStatus() == SelfAssessmentFormStatus.NOT_SUBMITTED) {
            if (finalApprovedScore == null) {
                finalApprovedScore = 0.0;
            }
            if (performance == null || performance.isBlank()) {
                performance = "Unsatisfactory";
            }
        }

        return new ScoreRecordDto(
                form.getId(),
                employeeInfo,
                form.getStatus().name(),
                finalApprovedScore,
                performance,
                form.getCycle() != null ? form.getCycle().getId() : null,
                form.getCycle() != null ? form.getCycle().getName() : null,
                form.getSubmittedDate(),
                form.getCreatedDate(),
                form.getHrFinalSignatureDate()
        );
    }

    private static String nullToDash(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }

    private List<SelfAssessmentSubmissionAttemptDto> buildSubmissionAttempts(SelfAssessmentForm form) {
        List<SelfAssessmentFormAnswer> sortedAnswers = form.getAnswers().stream()
                .sorted(Comparator.comparing(SelfAssessmentFormAnswer::getSortOrder))
                .toList();

        List<SelfAssessmentSubmissionAttemptDto> attempts = new ArrayList<>();

        if (form.getSubmittedDate() != null) {
            List<SelfAssessmentAttemptAnswerDto> originalAnswers = sortedAnswers.stream()
                    .map(a -> new SelfAssessmentAttemptAnswerDto(
                            a.getId(),
                            a.getQuestionText(),
                            a.getSortOrder(),
                            a.getYesNoAnswer(),
                            a.getRating(),
                            a.getRemarks(),
                            null,
                            null
                    ))
                    .toList();
            attempts.add(new SelfAssessmentSubmissionAttemptDto(
                    1,
                    form.getSubmittedDate(),
                    null,
                    originalAnswers
            ));
        }

        boolean hasRetakeSubmission = form.getRetakeSubmittedAt() != null
                || sortedAnswers.stream().anyMatch(a -> a.getRetakeYesNoAnswer() != null);
        if (hasRetakeSubmission) {
            Instant retakeSubmittedAt = form.getRetakeSubmittedAt() != null
                    ? form.getRetakeSubmittedAt()
                    : sortedAnswers.stream()
                            .map(SelfAssessmentFormAnswer::getRetakeSubmittedAt)
                            .filter(Objects::nonNull)
                            .max(Instant::compareTo)
                            .orElse(null);

            List<SelfAssessmentAttemptAnswerDto> retakeAnswers = sortedAnswers.stream()
                    .map(a -> {
                        if (Boolean.TRUE.equals(a.getRetakeRequested()) && a.getRetakeYesNoAnswer() != null) {
                            return new SelfAssessmentAttemptAnswerDto(
                                    a.getId(),
                                    a.getQuestionText(),
                                    a.getSortOrder(),
                                    a.getRetakeYesNoAnswer(),
                                    a.getRetakeRating(),
                                    a.getRemarks(),
                                    a.getRetakeReason(),
                                    null
                            );
                        }
                        return new SelfAssessmentAttemptAnswerDto(
                                a.getId(),
                                a.getQuestionText(),
                                a.getSortOrder(),
                                a.getYesNoAnswer(),
                                a.getRating(),
                                a.getRemarks(),
                                null,
                                null
                        );
                    })
                    .toList();

            String aggregateRetakeReason = sortedAnswers.stream()
                    .map(SelfAssessmentFormAnswer::getRetakeReason)
                    .filter(reason -> reason != null && !reason.isBlank())
                    .distinct()
                    .collect(Collectors.joining("; "));

            attempts.add(new SelfAssessmentSubmissionAttemptDto(
                    attempts.size() + 1,
                    retakeSubmittedAt,
                    aggregateRetakeReason.isBlank() ? null : aggregateRetakeReason,
                    retakeAnswers
            ));
        }

        if (form.getManagerForceChangeApprovedAt() != null) {
            List<SelfAssessmentAttemptAnswerDto> forceChangedAnswers = sortedAnswers.stream()
                    .map(a -> new SelfAssessmentAttemptAnswerDto(
                            a.getId(),
                            a.getQuestionText(),
                            a.getSortOrder(),
                            a.getFinalApprovedYesNo(),
                            a.getFinalApprovedRating(),
                            a.getRemarks(),
                            null,
                            a.getManagerForceChangeReason()
                    ))
                    .toList();

            String aggregateManagerReasons = sortedAnswers.stream()
                    .map(SelfAssessmentFormAnswer::getManagerForceChangeReason)
                    .filter(reason -> reason != null && !reason.isBlank())
                    .distinct()
                    .collect(Collectors.joining("; "));

            attempts.add(new SelfAssessmentSubmissionAttemptDto(
                    attempts.size() + 1,
                    form.getManagerForceChangeApprovedAt(),
                    aggregateManagerReasons.isBlank() ? null : aggregateManagerReasons,
                    forceChangedAnswers
            ));
        }

        return attempts;
    }

    private SelfAssessmentFormDto toFormDto(SelfAssessmentForm form) {
        Employee emp = form.getEmployee();
        EmployeeInfoDto employeeInfo = new EmployeeInfoDto(
                emp.getId(),
                emp.getEmployeeId(),
                emp.getEmployeeName(),
                emp.getEmail(),
                emp.getDepartment() != null ? emp.getDepartment().getId() : null,
                emp.getDepartment() != null ? emp.getDepartment().getName() : null,
                emp.getDepartment() != null ? emp.getDepartment().getCode() : null,
                emp.getPosition() != null ? emp.getPosition().getId() : null,
                emp.getPosition() != null ? emp.getPosition().getName() : null,
                emp.getPosition() != null ? emp.getPosition().getCode() : null,
                resolveEmployeeRoleId(emp)
        );

        List<AnswerDto> answers = form.getAnswers().stream()
                .map(a -> new AnswerDto(
                        a.getId(),
                        a.getQuestionText(),
                        a.getSortOrder(),
                        a.getYesNoAnswer(),
                        a.getRating(),
                        a.getRemarks(),
                        a.getManagerProposedYesNo(),
                        a.getManagerProposedRating(),
                        a.getManagerProposedComment(),
                        a.getHrAdjustmentApproved(),
                        a.getFinalApprovedYesNo(),
	                        a.getFinalApprovedRating(),
	                        Boolean.TRUE.equals(a.getRetakeRequested()),
	                        a.getRetakeRequestComment(),
	                        a.getRetakeYesNoAnswer(),
	                        a.getRetakeRating(),
	                        a.getRetakeReason(),
	                        a.getRetakeSubmittedAt(),
	                        a.getRetakeApproved(),
	                        Boolean.TRUE.equals(a.getManagerForceChanged()),
	                        a.getManagerForceChangeReason(),
	                        a.getManagerForceChangedAt()
	                ))
                .collect(Collectors.toList());

        List<AdjustmentDto> adjustments = adjustmentRepository.findByForm(form).stream()
                .map(a -> new AdjustmentDto(
                        a.getId(),
                        a.getQuestionText(),
                        a.getSortOrder(),
                        a.getOriginalYesNo(),
                        a.getOriginalRating(),
                        a.getProposedYesNo(),
                        a.getProposedRating(),
                        a.getManagerComment(),
                        a.getHrDecision(),
                        a.getHrRejectionReason(),
                        a.getAdjustedAt(),
                        a.getAdjustedBy()
                ))
                .collect(Collectors.toList());

        String managerName = form.getManager() != null ? form.getManager().getEmployeeName() : null;
        Signature employeeSignature = resolveSignature(form.getEmployeeSignatureId());
        Signature managerSignature = resolveSignature(form.getManagerSignatureId());
        Signature hrSignature = resolveSignature(form.getHrSignatureId());
        Signature hrFinalSignature = resolveSignature(form.getHrFinalSignatureId());
        Signature hrAdjustmentSignature = resolveSignature(form.getHrAdjustmentSignatureId());
        String hrName = resolveHrName(form, hrFinalSignature, hrSignature, hrAdjustmentSignature);

        return new SelfAssessmentFormDto(
                form.getId(),
                form.getTemplate().getId(),
                form.getCycle() != null ? form.getCycle().getId() : null,
                form.getCycle() != null ? form.getCycle().getName() : null,
                form.getCycle() != null ? form.getCycle().getStartDate() : null,
                form.getCycle() != null ? form.getCycle().getEndDate() : null,
                resolveFormDisplayTitle(form),
                SelfAssessmentRatingSystem.defaultIfNull(form.getRatingSystem()).name(),
                resolveSavedTenPointYesMinRating(form.getTenPointYesMinRating()),
                form.getStartDate(),
                form.getDeadlineDate(),
                form.getManagerReviewDeadlineDate(),
                resolveFinalApprovalDeadlineDate(form),
                form.getAssignedAt(),
                form.getAssignedBy(),
                form.getStatus().name(),
                form.getTotalScore(),
                form.getRatingCategory(),
                form.getEmployeeRemarks(),
                form.getEmployeeSignatureId(),
                signatureData(employeeSignature),
                signatureType(employeeSignature),
                form.getEmployeeSignatureDate(),
                form.getOverallRemarks(),
                form.getManager() != null ? form.getManager().getId() : null,
                managerName,
                form.getManagerSignatureId(),
                signatureData(managerSignature),
                signatureType(managerSignature),
                form.getManagerSignatureDate(),
                form.getManagerComments(),
                form.getHrSignatureId(),
                signatureData(hrSignature),
                signatureType(hrSignature),
                form.getHrSignatureDate(),
                form.getHrFinalSignatureId(),
                signatureData(hrFinalSignature),
                signatureType(hrFinalSignature),
                form.getHrFinalSignatureDate(),
                form.getHrAdjustmentSignatureId(),
                signatureData(hrAdjustmentSignature),
                signatureType(hrAdjustmentSignature),
                form.getHrAdjustmentSignatureDate(),
                form.getCreatedDate(),
                form.getSubmittedDate(),
                form.getAssessmentDate(),
                employeeInfo,
                answers,
                adjustments,
                form.getManagerRevisedTotalScore(),
                form.getFinalApprovedTotalScore(),
                form.getEmployeeAcknowledgedAt(),
                form.getEmployeeDisputedAt(),
	                form.getEmployeeDisputeReason(),
	                form.getRetakeRequestedAt(),
	                form.getRetakeSubmittedAt(),
	                Boolean.TRUE.equals(form.getRetakeRequestUsed()),
	                form.getManagerApprovedRetakeAt(),
	                form.getManagerForceChangeApprovedAt(),
	                form.getHrReviewRequired(),
                form.getHrReviewReason(),
                form.getHrReviewReasonAt(),
                hrName,
                buildSubmissionAttempts(form),
                pendingUnlockRequestDto(form)
        );
    }

    private SelfAssessmentUnlockRequestDto pendingUnlockRequestDto(SelfAssessmentForm form) {
        if (unlockRequestRepository == null) {
            return null;
        }
        Optional<SelfAssessmentUnlockRequest> request = unlockRequestRepository
                .findFirstByFormAndStatusOrderByRequestedAtDesc(form, SelfAssessmentUnlockRequestStatus.PENDING);
        return request == null ? null : request.map(this::toUnlockRequestDto).orElse(null);
    }

    private boolean hasResolvedUnlockRequest(SelfAssessmentForm form) {
        if (unlockRequestRepository == null) {
            return false;
        }
        Optional<SelfAssessmentUnlockRequest> request = unlockRequestRepository
                .findFirstByFormAndStatusOrderByRequestedAtDesc(form, SelfAssessmentUnlockRequestStatus.UNLOCKED);
        return request != null && request.isPresent();
    }

    private SelfAssessmentUnlockRequestDto toUnlockRequestDto(SelfAssessmentUnlockRequest request) {
        SelfAssessmentForm form = request.getForm();
        Employee employee = request.getEmployee();
        User requestedBy = request.getRequestedBy();
        User resolvedBy = request.getResolvedBy();
        return new SelfAssessmentUnlockRequestDto(
                request.getId(),
                form != null ? form.getId() : null,
                employee != null ? employee.getId() : null,
                employee != null ? employee.getEmployeeId() : null,
                employee != null ? employee.getEmployeeName() : null,
                requestedBy != null ? requestedBy.getId() : null,
                displayNameFromUser(requestedBy),
                resolvedBy != null ? resolvedBy.getId() : null,
                displayNameFromUser(resolvedBy),
                request.getStatus() != null ? request.getStatus().name() : null,
                request.getReasonCode() != null ? request.getReasonCode().name() : null,
                request.getReasonText(),
                request.getHrReasonCode(),
                request.getHrReasonText(),
                request.getUnlockDeadline(),
                request.getRequestedAt(),
                request.getResolvedAt(),
                form != null ? resolveFormDisplayTitle(form) : null,
                form != null && form.getCycle() != null ? form.getCycle().getId() : null,
                form != null && form.getCycle() != null ? form.getCycle().getName() : null,
                form != null ? form.getManagerReviewDeadlineDate() : null);
    }

    private String normalizeReasonText(String text) {
        return text == null || text.trim().isBlank() ? null : text.trim();
    }

    private String formatUnlockRequestReason(SelfAssessmentUnlockRequest request) {
        if (request == null || request.getReasonCode() == null) {
            return "-";
        }
        String label = switch (request.getReasonCode()) {
            case TYPO_COMMENT -> "Typo or comment correction";
            case WRONG_RATING -> "Wrong rating selected";
            case INCOMPLETE_ANSWER -> "Incomplete answer";
            case WRONG_ANSWER -> "Wrong answer selected";
            case OTHER -> "Other";
        };
        String text = request.getReasonText();
        if (text != null && !text.isBlank()) {
            return label + " — " + text.trim();
        }
        return label;
    }

    private String snapshotAnswers(SelfAssessmentForm form) {
        StringBuilder json = new StringBuilder();
        json.append("{\"formId\":").append(form.getId())
                .append(",\"status\":\"").append(form.getStatus()).append("\"")
                .append(",\"submittedDate\":").append(jsonString(form.getSubmittedDate()))
                .append(",\"assessmentDate\":").append(jsonString(form.getAssessmentDate()))
                .append(",\"deadlineDate\":").append(jsonString(form.getDeadlineDate()))
                .append(",\"answers\":[");
        List<SelfAssessmentFormAnswer> sortedAnswers = form.getAnswers().stream()
                .sorted(Comparator.comparing(SelfAssessmentFormAnswer::getSortOrder))
                .toList();
        for (int i = 0; i < sortedAnswers.size(); i++) {
            SelfAssessmentFormAnswer answer = sortedAnswers.get(i);
            if (i > 0) {
                json.append(',');
            }
            json.append("{\"answerId\":").append(answer.getId())
                    .append(",\"questionText\":").append(jsonString(answer.getQuestionText()))
                    .append(",\"sortOrder\":").append(answer.getSortOrder())
                    .append(",\"yesNoAnswer\":").append(jsonString(answer.getYesNoAnswer()))
                    .append(",\"rating\":").append(answer.getRating())
                    .append(",\"remarks\":").append(jsonString(answer.getRemarks()))
                    .append(",\"retakeRequested\":").append(Boolean.TRUE.equals(answer.getRetakeRequested()))
                    .append(",\"retakeYesNoAnswer\":").append(jsonString(answer.getRetakeYesNoAnswer()))
                    .append(",\"retakeRating\":").append(answer.getRetakeRating())
                    .append(",\"finalApprovedYesNo\":").append(jsonString(answer.getFinalApprovedYesNo()))
                    .append(",\"finalApprovedRating\":").append(answer.getFinalApprovedRating())
                    .append(",\"managerForceChanged\":").append(Boolean.TRUE.equals(answer.getManagerForceChanged()))
                    .append(",\"managerForceChangeReason\":").append(jsonString(answer.getManagerForceChangeReason()))
                    .append('}');
        }
        json.append("]}");
        return json.toString();
    }

    private String jsonString(Object value) {
        if (value == null) {
            return "null";
        }
        String escaped = String.valueOf(value)
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
        return "\"" + escaped + "\"";
    }

    private Signature resolveSignature(Long signatureId) {
        if (signatureId == null) {
            return null;
        }
        return signatureRepository.findByIdWithUserAndEmployee(signatureId)
                .or(() -> signatureRepository.findById(signatureId))
                .orElse(null);
    }

    private String signatureData(Signature signature) {
        return signature == null ? null : signature.getSignatureData();
    }

    private String signatureType(Signature signature) {
        return signature == null ? null : signature.getSignatureType();
    }

    private void recordHrSigner(SelfAssessmentForm form, User hrUser) {
        String name = displayNameFromUser(hrUser);
        if (name != null && !name.isBlank()) {
            form.setHrSignerName(name.trim());
        }
    }

    private User findHrUser(Long hrUserId) {
        return userRepository.findByIdWithEmployeeDepartment(hrUserId)
                .or(() -> userRepository.findById(hrUserId))
                .orElseThrow(() -> new RuntimeException("HR user not found"));
    }

    private String displayNameFromUser(User user) {
        if (user == null) {
            return null;
        }
        if (user.getEmployee() != null) {
            String name = user.getEmployee().getEmployeeName();
            if (name != null && !name.isBlank()) {
                return name.trim();
            }
        }
        return user.getEmail();
    }

    private String resolveHrName(
            SelfAssessmentForm form,
            Signature hrFinalSignature,
            Signature hrSignature,
            Signature hrAdjustmentSignature) {
        if (form.getHrSignerName() != null && !form.getHrSignerName().isBlank()) {
            return form.getHrSignerName().trim();
        }
        Signature displayedHrSignature = hrFinalSignature != null
                ? hrFinalSignature
                : hrSignature != null ? hrSignature : hrAdjustmentSignature;
        String fromSignature = signerNameFromSignature(displayedHrSignature);
        if (fromSignature != null && !fromSignature.isBlank()) {
            return fromSignature;
        }
        return resolveHrNameFromAudit(form.getId());
    }

    private String signerNameFromSignature(Signature signature) {
        if (signature == null || signature.getUser() == null) {
            return null;
        }
        String direct = displayNameFromUser(signature.getUser());
        if (direct != null && !direct.isBlank()) {
            return direct;
        }
        Long userId = signature.getUser().getId();
        if (userId == null) {
            return null;
        }
        return userRepository.findByIdWithEmployeeDepartment(userId)
                .map(this::displayNameFromUser)
                .orElse(null);
    }

    private String resolveHrNameFromAudit(Long formId) {
        if (formId == null) {
            return null;
        }
        Set<String> hrActions = Set.of(
                AuditActionType.SELF_ASSESSMENT_FORM_HR_APPROVED,
                AuditActionType.SELF_ASSESSMENT_FORM_HR_APPROVED_ADJUSTMENT,
                AuditActionType.SELF_ASSESSMENT_FORM_HR_REJECTED_ADJUSTMENT,
                AuditActionType.SELF_ASSESSMENT_FORM_HR_REOPENED);
        return auditLogRepository
                .findByTargetTypeAndTargetIdOrderByCreatedAtDesc(AuditTargetType.SELF_ASSESSMENT_FORM, formId)
                .stream()
                .filter(log -> hrActions.contains(log.getActionType()))
                .map(log -> log.getPerformedByUserId())
                .filter(Objects::nonNull)
                .findFirst()
                .flatMap(userId -> userRepository.findByIdWithEmployeeDepartment(userId))
                .map(this::displayNameFromUser)
                .orElse(null);
    }

    private FormListDto toFormListDto(SelfAssessmentForm form) {
        Employee emp = form.getEmployee();
        EmployeeInfoDto employeeInfo = new EmployeeInfoDto(
                emp.getId(),
                emp.getEmployeeId(),
                emp.getEmployeeName(),
                emp.getEmail(),
                emp.getDepartment() != null ? emp.getDepartment().getId() : null,
                emp.getDepartment() != null ? emp.getDepartment().getName() : null,
                emp.getDepartment() != null ? emp.getDepartment().getCode() : null,
                emp.getPosition() != null ? emp.getPosition().getId() : null,
                emp.getPosition() != null ? emp.getPosition().getName() : null,
                emp.getPosition() != null ? emp.getPosition().getCode() : null,
                resolveEmployeeRoleId(emp)
        );

        return new FormListDto(
                form.getId(),
                form.getTemplate() != null ? form.getTemplate().getId() : null,
                resolveFormDisplayTitle(form),
                form.getCycle() != null ? form.getCycle().getId() : null,
                form.getCycle() != null ? form.getCycle().getName() : null,
                form.getStartDate(),
                form.getDeadlineDate(),
                form.getManagerReviewDeadlineDate(),
                resolveFinalApprovalDeadlineDate(form),
                form.getAssignedAt(),
                form.getAssignedBy(),
                employeeInfo,
                form.getStatus().name(),
                form.getTotalScore(),
                form.getRatingCategory(),
                form.getSubmittedDate(),
                form.getAssessmentDate(),
                form.getRetakeSubmittedAt(),
                form.getCreatedDate()
        );
    }

    private String findQuestionText(SelfAssessmentForm form, Long answerId) {
        return form.getAnswers().stream()
                .filter(a -> a.getId().equals(answerId))
                .map(SelfAssessmentFormAnswer::getQuestionText)
                .findFirst()
                .orElse("");
    }

    private int findSortOrder(SelfAssessmentForm form, Long answerId) {
        return form.getAnswers().stream()
                .filter(a -> a.getId().equals(answerId))
                .map(SelfAssessmentFormAnswer::getSortOrder)
                .findFirst()
                .orElse(0);
    }

    private String findOriginalYesNo(SelfAssessmentForm form, Long answerId) {
        return form.getAnswers().stream()
                .filter(a -> a.getId().equals(answerId))
                .map(SelfAssessmentFormAnswer::getYesNoAnswer)
                .findFirst()
                .orElse(null);
    }

    private Integer findOriginalRating(SelfAssessmentForm form, Long answerId) {
        return form.getAnswers().stream()
                .filter(a -> a.getId().equals(answerId))
                .map(SelfAssessmentFormAnswer::getRating)
                .findFirst()
                .orElse(null);
    }
}
