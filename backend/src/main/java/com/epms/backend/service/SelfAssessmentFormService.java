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
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class SelfAssessmentFormService {

    private static final DateTimeFormatter NOTIFICATION_DEADLINE_FORMAT =
            DateTimeFormatter.ofPattern("dd-MM-yyyy");

    private final SelfAssessmentFormTemplateRepository templateRepository;
    private final SelfAssessmentFormRepository formRepository;
    private final SelfAssessmentFormAdjustmentRepository adjustmentRepository;
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final SignatureRepository signatureRepository;
    private final ReviewCycleService reviewCycleService;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final SelfAssessmentSettingsRepository settingsRepository;

    public SelfAssessmentFormService(
            SelfAssessmentFormTemplateRepository templateRepository,
            SelfAssessmentFormRepository formRepository,
            SelfAssessmentFormAdjustmentRepository adjustmentRepository,
            EmployeeRepository employeeRepository,
            DepartmentRepository departmentRepository,
            PositionRepository positionRepository,
            SignatureRepository signatureRepository,
            ReviewCycleService reviewCycleService,
            NotificationService notificationService,
            AuditService auditService,
            UserRepository userRepository,
            NotificationRepository notificationRepository,
            SelfAssessmentSettingsRepository settingsRepository) {
        this.templateRepository = templateRepository;
        this.formRepository = formRepository;
        this.adjustmentRepository = adjustmentRepository;
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.positionRepository = positionRepository;
        this.signatureRepository = signatureRepository;
        this.reviewCycleService = reviewCycleService;
        this.notificationService = notificationService;
        this.auditService = auditService;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.settingsRepository = settingsRepository;
    }

    @Transactional
    public SelfAssessmentFormTemplateDto createTemplate(CreateTemplateRequest request, Long userId) {
        ReviewCycle cycle = reviewCycleService.resolveCycleForSelfAssessmentTemplate(request.reviewCycleId());
        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new RuntimeException("Department not found"));
        Position position = positionRepository.findById(request.positionId())
                .orElseThrow(() -> new RuntimeException("Position not found"));

        Optional<SelfAssessmentFormTemplate> existing = templateRepository
                .findActiveByDepartmentAndPositionAndReviewCycleId(
                        request.departmentId(), request.positionId(), cycle.getId());
        if (existing.isPresent()) {
            throw new RuntimeException("An active template already exists for this department, position, and review cycle");
        }

        SelfAssessmentFormTemplate template = new SelfAssessmentFormTemplate();
        template.setTitle(request.title().trim());
        template.setDepartment(department);
        template.setPosition(position);
        template.setReviewCycle(cycle);
        template.setRatingSystem(resolveTemplateRatingSystem(request.ratingSystem()));
        template.setActive(true);
        template.setCreatedBy(userId);
        template.setCreatedOn(Instant.now());

        SelfAssessmentFormTemplate saved = templateRepository.saveAndFlush(template);

        for (int i = 0; i < request.questions().size(); i++) {
            QuestionRequest qr = request.questions().get(i);
            SelfAssessmentFormTemplateQuestion question = new SelfAssessmentFormTemplateQuestion();
            question.setQuestionText(qr.questionText());
            question.setSortOrder(i);
            question.setCreatedBy(userId);
            question.setCreatedOn(Instant.now());
            saved.addQuestion(question);
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
    public SelfAssessmentFormTemplateDto updateTemplate(Long id, UpdateTemplateRequest request, Long userId) {
        SelfAssessmentFormTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found"));
        assertTemplateEditable(template);

        Long rcId = template.getReviewCycle() != null ? template.getReviewCycle().getId() : null;
        Optional<SelfAssessmentFormTemplate> existing = rcId != null
                ? templateRepository.findActiveByDepartmentAndPositionAndReviewCycleIdExcluding(
                        request.departmentId(), request.positionId(), rcId, id)
                : templateRepository.findActiveByDepartmentAndPositionWithNullReviewCycleExcluding(
                        request.departmentId(), request.positionId(), id);
        if (existing.isPresent() && request.isActive()) {
            throw new RuntimeException("An active template already exists for this department, position, and review cycle");
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
        LocalDate deadlineDate = request.deadlineDate();
        if (deadlineDate.isBefore(activeCycle.getStartDate())) {
            throw new RuntimeException("Deadline cannot be before the active cycle start date");
        }
        if (deadlineDate.isAfter(activeCycle.getEndDate())) {
            throw new RuntimeException("Deadline cannot be after the active cycle end date");
        }

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

            SelfAssessmentForm form = createAssignedDraftForm(employee, template, activeCycle, deadlineDate, now, userId);
            formRepository.save(form);
            created++;

            notificationService.send(
                    employee.getUserAccount(),
                    "Self-Assessment Assigned",
                    "A self-assessment form has been assigned to you. Deadline: "
                            + deadlineDate.format(NOTIFICATION_DEADLINE_FORMAT),
                    "SELF_ASSESSMENT_FORM");
        }

        auditService.record(
                AuditActionType.SELF_ASSESSMENT_FORM_TEMPLATE_UPDATED,
                AuditTargetType.SELF_ASSESSMENT_FORM_TEMPLATE,
                template.getId(),
                userId,
                null,
                "Set self-assessment deadline and assigned " + created + " forms; skipped " + skipped,
                null);

        return new SetTemplateDeadlineResponse(
                template.getId(),
                template.getTitle(),
                template.getDepartment().getId(),
                template.getDepartment().getName(),
                template.getPosition().getId(),
                template.getPosition().getName(),
                template.getTitle(),
                deadlineDate,
                toCycleInfo(activeCycle),
                created,
                skipped);
    }

    @Transactional
    public SelfAssessmentAssignmentResponse assignSelfAssessmentForms(SelfAssessmentAssignmentRequest request, Long userId) {
        AssignmentMode assignmentMode = parseAssignmentMode(request.assignmentMode());
        validateAssignmentSelections(assignmentMode, request.departmentIds(), request.positionIds());

        ReviewCycle activeCycle = requireActiveCycle();
        validateAssignmentDeadlines(
                request.deadlineDate(),
                request.managerReviewDeadlineDate(),
                request.finalApprovalDeadlineDate(),
                activeCycle);

        Set<Long> departmentIds = toIdSet(request.departmentIds());
        Set<Long> positionIds = toIdSet(request.positionIds());
        List<Employee> candidates = employeeRepository.findEligibleSelfAssessmentAssignees(
                EmployeeStatus.ACTIVE,
                StaffTypes.PROBATION);

        int created = 0;
        int skippedExisting = 0;
        int skippedNoTemplate = 0;
        Instant now = Instant.now();

        for (Employee employee : candidates) {
            if (!matchesAssignmentMode(employee, assignmentMode, departmentIds, positionIds)) {
                continue;
            }
            if (formRepository.existsByEmployeeAndCycle(employee, activeCycle)) {
                skippedExisting++;
                continue;
            }

            Long departmentId = getEmployeeDepartmentId(employee);
            Long positionId = getEmployeePositionId(employee);
            if (departmentId == null || positionId == null) {
                skippedNoTemplate++;
                continue;
            }

            Optional<SelfAssessmentFormTemplate> templateOpt = templateRepository.findActiveByDepartmentAndPositionAndReviewCycleId(
                    departmentId,
                    positionId,
                    activeCycle.getId());
            if (templateOpt.isEmpty()) {
                skippedNoTemplate++;
                continue;
            }

            SelfAssessmentForm form = createAssignedDraftForm(
                    employee,
                    templateOpt.get(),
                    activeCycle,
                    request.deadlineDate(),
                    request.managerReviewDeadlineDate(),
                    request.finalApprovalDeadlineDate(),
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
        }

        auditService.record(
                AuditActionType.SELF_ASSESSMENT_FORM_TEMPLATE_UPDATED,
                AuditTargetType.SELF_ASSESSMENT_FORM,
                null,
                userId,
                null,
                "Bulk assigned self-assessment forms: created " + created
                        + ", skipped existing " + skippedExisting
                        + ", skipped no template " + skippedNoTemplate,
                null);

        return new SelfAssessmentAssignmentResponse(
                created,
                skippedExisting,
                skippedNoTemplate,
                0,
                toCycleInfo(activeCycle));
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
            boolean deadlinePassed = isDeadlinePassed(form);
            if (deadlinePassed && form.getStatus() == SelfAssessmentFormStatus.DRAFT) {
                form.setStatus(SelfAssessmentFormStatus.NOT_SUBMITTED);
                formRepository.save(form);
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

    @Transactional(readOnly = true)
    public Optional<SelfAssessmentFormDto> getEmployeeCurrentForm(Employee employee) {
        ReviewCycle activeCycle = getActiveCycle();
        if (activeCycle == null) {
            throw new RuntimeException("No active cycle found");
        }

        Optional<SelfAssessmentForm> existingForm = formRepository.findByEmployeeAndCycle(employee, activeCycle);

        if (existingForm.isPresent()) {
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
                    .anyMatch(f -> f.getCycle().equals(form.getCycle()) &&
                            (f.getStatus() == SelfAssessmentFormStatus.SUBMITTED ||
                                    f.getStatus() == SelfAssessmentFormStatus.MANAGER_REVIEWED ||
                                    f.getStatus() == SelfAssessmentFormStatus.APPROVED));
            if (alreadySubmitted) {
                throw new RuntimeException("You have already submitted your self-assessment for this cycle.");
            }
        }

        updateAnswers(form, request.answers());
        form.setEmployeeRemarks(request.employeeRemarks());
        form.setOverallRemarks(request.overallRemarks());

        Signature defaultSig = signatureRepository.findByUserAndIsDefaultTrue(employee.getUserAccount())
                .orElseThrow(() -> new RuntimeException("No default signature found. Please set up your signature before submitting."));

        form.setEmployeeSignatureId(defaultSig.getId());
        form.setEmployeeSignatureDate(Instant.now());
        form.setStatus(SelfAssessmentFormStatus.SUBMITTED);
        Instant submittedAt = Instant.now();
        form.setSubmittedDate(submittedAt);
        form.setAssessmentDate(LocalDate.ofInstant(submittedAt, ZoneId.systemDefault()));
        form.setUpdatedDate(submittedAt);

        calculateScore(form);

        SelfAssessmentForm saved = formRepository.save(form);

        auditService.record(
                AuditActionType.SELF_ASSESSMENT_FORM_SUBMITTED,
                AuditTargetType.SELF_ASSESSMENT_FORM,
                saved.getId(),
                employee.getUserAccount().getId(),
                null,
                "Submitted self-assessment form with score " + saved.getTotalScore(),
                null);

        return toFormDto(saved);
    }

    @Transactional
    public SelfAssessmentSettingsDto getSettings() {
        return toSettingsDto(getOrCreateSettings());
    }

    @Transactional
    public SelfAssessmentSettingsDto updateSettings(SelfAssessmentSettingsRequest request, Long userId) {
        SelfAssessmentRatingSystem targetRatingSystem = parseRatingSystem(request.ratingSystem());
        SelfAssessmentSettings settings = getOrCreateSettings();
        settings.setRatingSystem(targetRatingSystem);
        settings.setUpdatedBy(userId);
        settings.setUpdatedOn(Instant.now());
        settingsRepository.save(settings);
        syncUnassignedTemplatesInActiveCycle(targetRatingSystem, userId);
        return toSettingsDto(settings);
    }

    @Transactional(readOnly = true)
    public List<FormListDto> getManagerReviewForms(Employee manager) {
        ReviewCycle activeCycle = getActiveCycle();
        if (activeCycle == null) {
            return List.of();
        }

        return formRepository.findByManagerAndCycle(manager.getId(), activeCycle).stream()
                .filter(f -> f.getStatus() == SelfAssessmentFormStatus.SUBMITTED ||
                        f.getStatus() == SelfAssessmentFormStatus.MANAGER_REVIEWED)
                .map(this::toFormListDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FormListDto> getHrReviewForms() {
        ReviewCycle activeCycle = getActiveCycle();
        if (activeCycle == null) {
            return List.of();
        }

        return formRepository.findAll().stream()
                .filter(f -> f.getCycle().equals(activeCycle))
                .filter(f -> f.getStatus() == SelfAssessmentFormStatus.MANAGER_REVIEWED)
                .map(this::toFormListDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FormListDto> getAllFormsForHr() {
        ReviewCycle activeCycle = getActiveCycle();
        if (activeCycle == null) {
            return List.of();
        }

        return formRepository.findByCycleOrderByCreatedDateDesc(activeCycle).stream()
                .map(this::toFormListDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ActiveCycleFormsDto getActiveCycleFormsForHr() {
        ReviewCycle activeCycle = requireActiveCycle();
        List<FormListDto> forms = formRepository.findByCycleOrderByCreatedDateDesc(activeCycle).stream()
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

    @Transactional
    public SelfAssessmentFormDto managerReview(Long formId, Employee manager, ManagerReviewRequest request) {
        SelfAssessmentForm form = formRepository.findById(formId)
                .orElseThrow(() -> new RuntimeException("Form not found"));

        if (!canManagerReview(form, manager)) {
            throw new RuntimeException("You are not authorized to review this form");
        }

        if (form.getStatus() != SelfAssessmentFormStatus.SUBMITTED) {
            throw new RuntimeException("Form is not in SUBMITTED status for manager review");
        }

        Signature defaultSig = signatureRepository.findByUserAndIsDefaultTrue(manager.getUserAccount())
                .orElseThrow(() -> new RuntimeException("No default signature found. Please set up your signature before reviewing."));

        form.setManager(manager);
        form.setManagerSignatureId(defaultSig.getId());
        form.setManagerSignatureDate(Instant.now());
        form.setManagerComments(request.comments());
        form.setUpdatedDate(Instant.now());

        boolean hasAdjustments = false;
        if (request.adjustments() != null && !request.adjustments().isEmpty()) {
            hasAdjustments = true;
            SelfAssessmentRatingSystem ratingSystem = SelfAssessmentRatingSystem.defaultIfNull(form.getRatingSystem());
            for (ManagerAdjustmentRequest adj : request.adjustments()) {
                if (!ratingSystem.isValidYesNo(adj.proposedYesNo()) || adj.proposedRating() == null
                        || !ratingSystem.isValidRating(adj.proposedYesNo(), adj.proposedRating())) {
                    throw new RuntimeException("Proposed rating does not match the form rating system");
                }
                for (SelfAssessmentFormAnswer answer : form.getAnswers()) {
                    if (answer.getId().equals(adj.answerId())) {
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

        if (hasAdjustments) {
            form.setStatus(SelfAssessmentFormStatus.MANAGER_REVIEWED);
        } else {
            form.setStatus(SelfAssessmentFormStatus.MANAGER_REVIEWED);
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

        return toFormDto(saved);
    }

    @Transactional
    public SelfAssessmentFormDto hrApproveManagerReview(Long formId, HrApproveManagerReviewRequest request, Long hrUserId) {
        SelfAssessmentForm form = formRepository.findById(formId)
                .orElseThrow(() -> new RuntimeException("Form not found"));

        if (form.getStatus() != SelfAssessmentFormStatus.MANAGER_REVIEWED) {
            throw new RuntimeException("Form is not in MANAGER_REVIEWED status");
        }

        User hrUser = userRepository.findById(hrUserId)
                .orElseThrow(() -> new RuntimeException("HR user not found"));

        Signature defaultSig = signatureRepository.findByUserAndIsDefaultTrue(hrUser)
                .orElseThrow(() -> new RuntimeException("No default signature found. Please set up your signature before approving."));

        form.setHrAdjustmentSignatureId(defaultSig.getId());
        form.setHrAdjustmentSignatureDate(Instant.now());

        for (SelfAssessmentFormAnswer answer : form.getAnswers()) {
            if (answer.getManagerProposedYesNo() != null) {
                answer.setYesNoAnswer(answer.getManagerProposedYesNo());
                answer.setRating(answer.getManagerProposedRating());
                answer.setHrAdjustmentApproved(true);
            }
        }

        calculateScore(form);
        form.setStatus(SelfAssessmentFormStatus.MANAGER_REVIEWED);
        form.setUpdatedDate(Instant.now());

        SelfAssessmentForm saved = formRepository.save(form);

        auditService.record(
                AuditActionType.SELF_ASSESSMENT_FORM_HR_APPROVED_ADJUSTMENT,
                AuditTargetType.SELF_ASSESSMENT_FORM,
                saved.getId(),
                hrUserId,
                null,
                "HR approved manager adjustments. New score: " + saved.getTotalScore(),
                null);

        return toFormDto(saved);
    }

    @Transactional
    public SelfAssessmentFormDto hrRejectManagerReview(Long formId, HrRejectManagerReviewRequest request, Long hrUserId) {
        SelfAssessmentForm form = formRepository.findById(formId)
                .orElseThrow(() -> new RuntimeException("Form not found"));

        if (form.getStatus() != SelfAssessmentFormStatus.MANAGER_REVIEWED) {
            throw new RuntimeException("Form is not in MANAGER_REVIEWED status");
        }

        User hrUser = userRepository.findById(hrUserId)
                .orElseThrow(() -> new RuntimeException("HR user not found"));

        Signature defaultSig = signatureRepository.findByUserAndIsDefaultTrue(hrUser)
                .orElseThrow(() -> new RuntimeException("No default signature found. Please set up your signature before rejecting."));

        form.setHrAdjustmentSignatureId(defaultSig.getId());
        form.setHrAdjustmentSignatureDate(Instant.now());

        for (SelfAssessmentFormAnswer answer : form.getAnswers()) {
            answer.setManagerProposedYesNo(null);
            answer.setManagerProposedRating(null);
            answer.setManagerProposedComment(null);
            answer.setHrAdjustmentApproved(null);
        }

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
    public SelfAssessmentFormDto hrApproveForm(Long formId, HrApproveFormRequest request, Long hrUserId) {
        SelfAssessmentForm form = formRepository.findById(formId)
                .orElseThrow(() -> new RuntimeException("Form not found"));

        if (form.getStatus() != SelfAssessmentFormStatus.MANAGER_REVIEWED) {
            throw new RuntimeException("Form is not in MANAGER_REVIEWED status");
        }

        User hrUser = userRepository.findById(hrUserId)
                .orElseThrow(() -> new RuntimeException("HR user not found"));

        Signature defaultSig = signatureRepository.findByUserAndIsDefaultTrue(hrUser)
                .orElseThrow(() -> new RuntimeException("No default signature found. Please set up your signature before approving."));

        form.setHrFinalSignatureId(defaultSig.getId());
        form.setHrFinalSignatureDate(Instant.now());
        form.setStatus(SelfAssessmentFormStatus.APPROVED);
        form.setUpdatedDate(Instant.now());

        SelfAssessmentForm saved = formRepository.save(form);

        auditService.record(
                AuditActionType.SELF_ASSESSMENT_FORM_HR_APPROVED,
                AuditTargetType.SELF_ASSESSMENT_FORM,
                saved.getId(),
                hrUserId,
                null,
                "HR approved self-assessment form with score " + saved.getTotalScore(),
                null);

        return toFormDto(saved);
    }

    @Transactional
    public SelfAssessmentFormDto hrReopenForm(Long formId, HrReopenFormRequest request, Long hrUserId) {
        SelfAssessmentForm form = formRepository.findById(formId)
                .orElseThrow(() -> new RuntimeException("Form not found"));

        if (form.getStatus() != SelfAssessmentFormStatus.APPROVED) {
            throw new RuntimeException("Only APPROVED forms can be reopened");
        }

        User hrUser = userRepository.findById(hrUserId)
                .orElseThrow(() -> new RuntimeException("HR user not found"));

        Signature defaultSig = signatureRepository.findByUserAndIsDefaultTrue(hrUser)
                .orElseThrow(() -> new RuntimeException("No default signature found. Please set up your signature before reopening."));

        form.setHrSignatureId(defaultSig.getId());
        form.setStatus(SelfAssessmentFormStatus.REOPENED);
        form.setAssessmentDate(null);
        form.setSubmittedDate(null);
        form.setEmployeeSignatureId(null);
        form.setEmployeeSignatureDate(null);
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
            if (isDeadlinePassed(form) && form.getStatus() == SelfAssessmentFormStatus.DRAFT) {
                form.setStatus(SelfAssessmentFormStatus.NOT_SUBMITTED);
                formRepository.save(form);
                throw new RuntimeException("Deadline has passed. Your draft was marked as not submitted.");
            }
            return form;
        }

        throw new RuntimeException("No self-assessment form has been assigned to you for the active cycle.");
    }

    private SelfAssessmentForm createAssignedDraftForm(
            Employee employee,
            SelfAssessmentFormTemplate template,
            ReviewCycle activeCycle,
            LocalDate deadlineDate,
            Instant assignedAt,
            Long assignedBy) {
        return createAssignedDraftForm(
                employee,
                template,
                activeCycle,
                deadlineDate,
                null,
                null,
                assignedAt,
                assignedBy);
    }

    private SelfAssessmentForm createAssignedDraftForm(
            Employee employee,
            SelfAssessmentFormTemplate template,
            ReviewCycle activeCycle,
            LocalDate deadlineDate,
            LocalDate managerReviewDeadlineDate,
            LocalDate finalApprovalDeadlineDate,
            Instant assignedAt,
            Long assignedBy) {
        SelfAssessmentForm form = new SelfAssessmentForm();
        form.setEmployee(employee);
        form.setTemplate(template);
        form.setCycle(activeCycle);
        form.setRatingSystem(SelfAssessmentRatingSystem.defaultIfNull(template.getRatingSystem()));
        form.setDeadlineDate(deadlineDate);
        form.setManagerReviewDeadlineDate(managerReviewDeadlineDate);
        form.setFinalApprovalDeadlineDate(finalApprovalDeadlineDate);
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
        HYBRID
    }

    private AssignmentMode parseAssignmentMode(String value) {
        String normalized = value == null ? "" : value.trim().toUpperCase().replace('-', '_');
        return switch (normalized) {
            case "ALL_EMPLOYEES", "ALL" -> AssignmentMode.ALL_EMPLOYEES;
            case "SPECIFIC_DEPARTMENTS", "DEPARTMENTS", "DEPARTMENT" -> AssignmentMode.DEPARTMENTS;
            case "SPECIFIC_POSITIONS", "POSITIONS", "POSITION" -> AssignmentMode.POSITIONS;
            case "HYBRID" -> AssignmentMode.HYBRID;
            default -> throw new RuntimeException("Invalid assignment mode");
        };
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

    private SelfAssessmentSettings getOrCreateSettings() {
        return settingsRepository.findById(SelfAssessmentSettings.SINGLETON_ID)
                .orElseGet(() -> {
                    SelfAssessmentSettings settings = new SelfAssessmentSettings();
                    settings.setId(SelfAssessmentSettings.SINGLETON_ID);
                    settings.setRatingSystem(SelfAssessmentRatingSystem.FIVE_POINT);
                    return settingsRepository.save(settings);
                });
    }

    private SelfAssessmentSettingsDto toSettingsDto(SelfAssessmentSettings settings) {
        boolean editable = !isRatingSystemLocked();
        return new SelfAssessmentSettingsDto(
                SelfAssessmentRatingSystem.defaultIfNull(settings.getRatingSystem()).name(),
                editable,
                editable ? null : getRatingSystemLockReason());
    }

    private boolean isRatingSystemLocked() {
        return false;
    }

    private String getRatingSystemLockReason() {
        return "Templates already assigned to a deadline keep their existing rating scale.";
    }

    private void syncUnassignedTemplatesInActiveCycle(SelfAssessmentRatingSystem ratingSystem, Long userId) {
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
            if (current != ratingSystem) {
                template.setRatingSystem(ratingSystem);
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

    private void validateAssignmentSelections(AssignmentMode mode, List<Long> departmentIds, List<Long> positionIds) {
        boolean hasDepartments = departmentIds != null && departmentIds.stream().anyMatch(id -> id != null && id > 0);
        boolean hasPositions = positionIds != null && positionIds.stream().anyMatch(id -> id != null && id > 0);
        if ((mode == AssignmentMode.DEPARTMENTS || mode == AssignmentMode.HYBRID) && !hasDepartments) {
            throw new RuntimeException("Please select at least one department");
        }
        if ((mode == AssignmentMode.POSITIONS || mode == AssignmentMode.HYBRID) && !hasPositions) {
            throw new RuntimeException("Please select at least one position");
        }
    }

    private void validateAssignmentDeadlines(
            LocalDate employeeDeadline,
            LocalDate managerDeadline,
            LocalDate finalDeadline,
            ReviewCycle activeCycle) {
        if (employeeDeadline == null || managerDeadline == null || finalDeadline == null) {
            throw new RuntimeException("All deadlines are required");
        }
        if (employeeDeadline.isAfter(managerDeadline)) {
            throw new RuntimeException("Manager review deadline cannot be earlier than the employee deadline.");
        }
        if (managerDeadline.isAfter(finalDeadline)) {
            throw new RuntimeException("Final approval deadline cannot be earlier than the manager review deadline.");
        }
        validateDateWithinActiveCycle(employeeDeadline, "Employee deadline", activeCycle);
        validateDateWithinActiveCycle(managerDeadline, "Manager review deadline", activeCycle);
        validateDateWithinActiveCycle(finalDeadline, "Final approval deadline", activeCycle);
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
            Set<Long> positionIds) {
        Long departmentId = getEmployeeDepartmentId(employee);
        Long positionId = getEmployeePositionId(employee);
        return switch (mode) {
            case ALL_EMPLOYEES -> true;
            case DEPARTMENTS -> departmentId != null && departmentIds.contains(departmentId);
            case POSITIONS -> positionId != null && positionIds.contains(positionId);
            case HYBRID -> departmentId != null && positionId != null
                    && departmentIds.contains(departmentId)
                    && positionIds.contains(positionId);
        };
    }

    private void updateAnswers(SelfAssessmentForm form, List<AnswerRequest> answerRequests) {
        if (answerRequests == null) return;

        SelfAssessmentRatingSystem ratingSystem = SelfAssessmentRatingSystem.defaultIfNull(form.getRatingSystem());
        for (AnswerRequest ar : answerRequests) {
            for (SelfAssessmentFormAnswer answer : form.getAnswers()) {
                if (answer.getId().equals(ar.id())) {
                    String effectiveYesNo = ar.yesNoAnswer() != null ? ar.yesNoAnswer() : answer.getYesNoAnswer();
                    Integer effectiveRating = ar.rating() != null ? ar.rating() : answer.getRating();
                    if ((effectiveRating != null && effectiveYesNo == null)
                            || !ratingSystem.isValidYesNo(effectiveYesNo)
                            || !ratingSystem.isValidRating(effectiveYesNo, effectiveRating)) {
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
        LocalDate deadline = form.getDeadlineDate();
        if (deadline == null && form.getCycle() != null) {
            deadline = form.getCycle().getEndDate();
        }
        return deadline != null && LocalDate.now().isAfter(deadline);
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

    private QuestionDto mapTemplateQuestionToDto(SelfAssessmentFormTemplateQuestion q) {
        return mapTemplateQuestionToDto(q, null, null);
    }

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
                template.isActive(),
                SelfAssessmentRatingSystem.defaultIfNull(template.getRatingSystem()).name(),
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

    private SelfAssessmentFormDto toFormDto(SelfAssessmentForm form) {
        Employee emp = form.getEmployee();
        EmployeeInfoDto employeeInfo = new EmployeeInfoDto(
                emp.getId(),
                emp.getEmployeeId(),
                emp.getEmployeeName(),
                emp.getEmail(),
                emp.getDepartment() != null ? emp.getDepartment().getId() : null,
                emp.getDepartment() != null ? emp.getDepartment().getName() : null,
                emp.getPosition() != null ? emp.getPosition().getId() : null,
                emp.getPosition() != null ? emp.getPosition().getName() : null
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
                        a.getHrAdjustmentApproved()
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

        return new SelfAssessmentFormDto(
                form.getId(),
                form.getTemplate().getId(),
                form.getCycle() != null ? form.getCycle().getId() : null,
                form.getCycle() != null ? form.getCycle().getName() : null,
                resolveFormDisplayTitle(form),
                SelfAssessmentRatingSystem.defaultIfNull(form.getRatingSystem()).name(),
                form.getDeadlineDate(),
                form.getManagerReviewDeadlineDate(),
                form.getFinalApprovalDeadlineDate(),
                form.getAssignedAt(),
                form.getAssignedBy(),
                form.getStatus().name(),
                form.getTotalScore(),
                form.getRatingCategory(),
                form.getEmployeeRemarks(),
                form.getEmployeeSignatureId(),
                form.getEmployeeSignatureDate(),
                form.getOverallRemarks(),
                form.getManager() != null ? form.getManager().getId() : null,
                managerName,
                form.getManagerSignatureId(),
                form.getManagerSignatureDate(),
                form.getManagerComments(),
                form.getHrSignatureId(),
                form.getHrSignatureDate(),
                form.getHrFinalSignatureId(),
                form.getHrFinalSignatureDate(),
                form.getHrAdjustmentSignatureId(),
                form.getHrAdjustmentSignatureDate(),
                form.getCreatedDate(),
                form.getSubmittedDate(),
                form.getAssessmentDate(),
                employeeInfo,
                answers,
                adjustments
        );
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
                emp.getPosition() != null ? emp.getPosition().getId() : null,
                emp.getPosition() != null ? emp.getPosition().getName() : null
        );

        return new FormListDto(
                form.getId(),
                resolveFormDisplayTitle(form),
                form.getCycle() != null ? form.getCycle().getId() : null,
                form.getCycle() != null ? form.getCycle().getName() : null,
                form.getDeadlineDate(),
                form.getManagerReviewDeadlineDate(),
                form.getFinalApprovalDeadlineDate(),
                form.getAssignedAt(),
                form.getAssignedBy(),
                employeeInfo,
                form.getStatus().name(),
                form.getTotalScore(),
                form.getRatingCategory(),
                form.getSubmittedDate(),
                form.getAssessmentDate(),
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
