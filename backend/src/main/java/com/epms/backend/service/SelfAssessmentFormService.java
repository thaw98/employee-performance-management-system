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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SelfAssessmentFormService {

    private final SelfAssessmentFormTemplateRepository templateRepository;
    private final SelfAssessmentFormRepository formRepository;
    private final SelfAssessmentFormAdjustmentRepository adjustmentRepository;
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final SignatureRepository signatureRepository;
    private final TimeSettingRepository timeSettingRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public SelfAssessmentFormService(
            SelfAssessmentFormTemplateRepository templateRepository,
            SelfAssessmentFormRepository formRepository,
            SelfAssessmentFormAdjustmentRepository adjustmentRepository,
            EmployeeRepository employeeRepository,
            DepartmentRepository departmentRepository,
            PositionRepository positionRepository,
            SignatureRepository signatureRepository,
            TimeSettingRepository timeSettingRepository,
            NotificationService notificationService,
            AuditService auditService,
            UserRepository userRepository,
            NotificationRepository notificationRepository) {
        this.templateRepository = templateRepository;
        this.formRepository = formRepository;
        this.adjustmentRepository = adjustmentRepository;
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.positionRepository = positionRepository;
        this.signatureRepository = signatureRepository;
        this.timeSettingRepository = timeSettingRepository;
        this.notificationService = notificationService;
        this.auditService = auditService;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public SelfAssessmentFormTemplateDto createTemplate(CreateTemplateRequest request, Long userId) {
        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new RuntimeException("Department not found"));
        Position position = positionRepository.findById(request.positionId())
                .orElseThrow(() -> new RuntimeException("Position not found"));

        Optional<SelfAssessmentFormTemplate> existing = templateRepository
                .findActiveByDepartmentAndPosition(request.departmentId(), request.positionId());
        if (existing.isPresent()) {
            throw new RuntimeException("An active template already exists for this department and position");
        }

        SelfAssessmentFormTemplate template = new SelfAssessmentFormTemplate();
        template.setDepartment(department);
        template.setPosition(position);
        template.setActive(true);
        template.setCreatedBy(userId);
        template.setCreatedOn(Instant.now());

        List<SelfAssessmentFormTemplateQuestion> questions = new ArrayList<>();
        for (int i = 0; i < request.questions().size(); i++) {
            QuestionRequest qr = request.questions().get(i);
            SelfAssessmentFormTemplateQuestion question = new SelfAssessmentFormTemplateQuestion();
            question.setQuestionText(qr.questionText());
            question.setSortOrder(i);
            question.setCreatedBy(userId);
            question.setCreatedOn(Instant.now());
            questions.add(question);
        }
        template.setQuestions(questions);
        questions.forEach(q -> q.setTemplate(template));

        SelfAssessmentFormTemplate saved = templateRepository.save(template);

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

        Optional<SelfAssessmentFormTemplate> existing = templateRepository
                .findActiveByDepartmentAndPositionExcluding(request.departmentId(), request.positionId(), id);
        if (existing.isPresent() && request.isActive()) {
            throw new RuntimeException("An active template already exists for this department and position");
        }

        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new RuntimeException("Department not found"));
        Position position = positionRepository.findById(request.positionId())
                .orElseThrow(() -> new RuntimeException("Position not found"));

        template.setDepartment(department);
        template.setPosition(position);
        template.setActive(request.isActive());
        template.setUpdatedBy(userId);
        template.setUpdatedOn(Instant.now());

        template.clearQuestions();
        List<SelfAssessmentFormTemplateQuestion> questions = new ArrayList<>();
        for (int i = 0; i < request.questions().size(); i++) {
            QuestionRequest qr = request.questions().get(i);
            SelfAssessmentFormTemplateQuestion question = new SelfAssessmentFormTemplateQuestion();
            question.setQuestionText(qr.questionText());
            question.setSortOrder(i);
            question.setCreatedBy(userId);
            question.setCreatedOn(Instant.now());
            questions.add(question);
        }
        template.setQuestions(questions);
        questions.forEach(q -> q.setTemplate(template));

        SelfAssessmentFormTemplate saved = templateRepository.save(template);
        syncExistingFormsWithTemplate(saved);

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

    @Transactional(readOnly = true)
    public List<SelfAssessmentFormTemplateDto> getAllTemplates() {
        return templateRepository.findAll().stream()
                .map(this::toTemplateDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SelfAssessmentFormTemplateDto getTemplateById(Long id) {
        SelfAssessmentFormTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found"));
        return toTemplateDto(template);
    }

    @Transactional(readOnly = true)
    public Optional<SelfAssessmentFormTemplateDto> getActiveTemplate(Long departmentId, Long positionId) {
        return templateRepository.findActiveByDepartmentAndPosition(departmentId, positionId)
                .map(this::toTemplateDto);
    }

    @Transactional(readOnly = true)
    public FormStatusDto getEmployeeFormStatus(Employee employee) {
        if (!isPermanentEmployee(employee)) {
            return new FormStatusDto(null, false, false, false, "You are not eligible for self-assessment. Only permanent employees can participate.");
        }

        TimeSetting activeCycle = getActiveCycle();
        if (activeCycle == null) {
            return new FormStatusDto(null, true, false, false, "No active cycle found in system settings.");
        }

        boolean deadlinePassed = isDeadlinePassed(activeCycle);

        DepartmentPosition dp = employee.getDepartmentPosition();
        if (dp == null) {
            return new FormStatusDto(null, true, false, deadlinePassed, "No department-position mapping found for you.");
        }

        Optional<SelfAssessmentFormTemplate> templateOpt = templateRepository
                .findActiveByDepartmentAndPosition(dp.getDepartment().getId(), dp.getPosition().getId());

        if (templateOpt.isEmpty()) {
            return new FormStatusDto(null, true, false, deadlinePassed, "No active self-assessment template available for your department and position.");
        }

        Optional<SelfAssessmentForm> existingForm = formRepository.findByEmployeeAndCycle(employee, activeCycle);

        if (existingForm.isPresent()) {
            SelfAssessmentForm form = existingForm.get();
            if (deadlinePassed && form.getStatus() == SelfAssessmentFormStatus.DRAFT) {
                form.setStatus(SelfAssessmentFormStatus.NOT_SUBMITTED);
                formRepository.save(form);
                return new FormStatusDto("NOT_SUBMITTED", true, true, true, "Deadline has passed. Your draft was marked as not submitted.");
            }
            return new FormStatusDto(form.getStatus().name(), true, true, deadlinePassed, null);
        }

        return new FormStatusDto("NOT_STARTED", true, true, deadlinePassed, null);
    }

    @Transactional(readOnly = true)
    public Optional<SelfAssessmentFormDto> getEmployeeCurrentForm(Employee employee) {
        TimeSetting activeCycle = getActiveCycle();
        if (activeCycle == null) {
            throw new RuntimeException("No active cycle found");
        }

        DepartmentPosition dp = employee.getDepartmentPosition();
        if (dp == null) {
            throw new RuntimeException("No department-position mapping found");
        }

        Optional<SelfAssessmentFormTemplate> templateOpt = templateRepository
                .findActiveByDepartmentAndPosition(dp.getDepartment().getId(), dp.getPosition().getId());

        if (templateOpt.isEmpty()) {
            throw new RuntimeException("No active template found for your department and position");
        }

        SelfAssessmentFormTemplate template = templateOpt.get();
        Optional<SelfAssessmentForm> existingForm = formRepository.findByEmployeeAndCycle(employee, activeCycle);

        if (existingForm.isPresent()) {
            return Optional.of(toFormDto(existingForm.get()));
        }

        SelfAssessmentForm newForm = new SelfAssessmentForm();
        newForm.setEmployee(employee);
        newForm.setTemplate(template);
        newForm.setCycle(activeCycle);
        newForm.setStatus(SelfAssessmentFormStatus.DRAFT);
        newForm.setCreatedDate(Instant.now());

        List<SelfAssessmentFormAnswer> answers = new ArrayList<>();
        for (SelfAssessmentFormTemplateQuestion tq : template.getQuestions()) {
            SelfAssessmentFormAnswer answer = new SelfAssessmentFormAnswer();
            answer.setQuestionText(tq.getQuestionText());
            answer.setSortOrder(tq.getSortOrder());
            answer.setForm(newForm);
            answers.add(answer);
        }
        newForm.setAnswers(answers);

        SelfAssessmentForm saved = formRepository.save(newForm);
        return Optional.of(toFormDto(saved));
    }

    @Transactional
    public SelfAssessmentFormDto saveDraft(Employee employee, SaveDraftRequest request) {
        SelfAssessmentForm form = getOrCreateForm(employee);

        if (form.getStatus() != SelfAssessmentFormStatus.DRAFT && form.getStatus() != SelfAssessmentFormStatus.REOPENED) {
            throw new RuntimeException("Form cannot be edited in current status: " + form.getStatus());
        }

        if (isDeadlinePassed(form.getCycle())) {
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

        if (isDeadlinePassed(form.getCycle())) {
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

        validateAllAnswersAnswered(form);

        Signature defaultSig = signatureRepository.findByUserAndIsDefaultTrue(employee.getUserAccount())
                .orElseThrow(() -> new RuntimeException("No default signature found. Please set up your signature before submitting."));

        form.setEmployeeSignatureId(defaultSig.getId());
        form.setEmployeeSignatureDate(Instant.now());
        form.setStatus(SelfAssessmentFormStatus.SUBMITTED);
        form.setSubmittedDate(Instant.now());
        form.setUpdatedDate(Instant.now());

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

    @Transactional(readOnly = true)
    public List<FormListDto> getManagerReviewForms(Employee manager) {
        TimeSetting activeCycle = getActiveCycle();
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
        TimeSetting activeCycle = getActiveCycle();
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
        TimeSetting activeCycle = getActiveCycle();
        if (activeCycle == null) {
            return List.of();
        }

        return formRepository.findAll().stream()
                .filter(f -> f.getCycle().equals(activeCycle))
                .map(this::toFormListDto)
                .collect(Collectors.toList());
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
            for (ManagerAdjustmentRequest adj : request.adjustments()) {
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
        TimeSetting activeCycle = getActiveCycle();
        if (activeCycle == null) return;

        LocalDate tomorrow = LocalDate.now().plusDays(1);
        if (activeCycle.getEndDate().equals(tomorrow)) {
            List<Employee> eligibleEmployees = employeeRepository.findAll().stream()
                    .filter(this::isPermanentEmployee)
                    .toList();

            for (Employee emp : eligibleEmployees) {
                Optional<SelfAssessmentForm> formOpt = formRepository.findByEmployeeAndCycle(emp, activeCycle);

                String message;
                String source = "SELF_ASSESSMENT_FORM";

                if (formOpt.isEmpty()) {
                    message = "Self-assessment due tomorrow";
                } else if (formOpt.get().getStatus() == SelfAssessmentFormStatus.DRAFT) {
                    message = "Your saved self-assessment draft is due tomorrow";
                } else {
                    continue;
                }

                Optional<Notification> existingNotif = notificationRepository.findByRecipientAndSourceAndMessageStartingWith(
                        emp.getUserAccount(), source, message.split(" due")[0]);
                if (existingNotif.isPresent()) {
                    continue;
                }

                notificationService.send(emp.getUserAccount(), "Self-Assessment Reminder", message, source);
            }
        }
    }

    private SelfAssessmentForm getOrCreateForm(Employee employee) {
        TimeSetting activeCycle = getActiveCycle();
        if (activeCycle == null) {
            throw new RuntimeException("No active cycle found");
        }

        DepartmentPosition dp = employee.getDepartmentPosition();
        if (dp == null) {
            throw new RuntimeException("No department-position mapping found");
        }

        SelfAssessmentFormTemplate template = templateRepository
                .findActiveByDepartmentAndPosition(dp.getDepartment().getId(), dp.getPosition().getId())
                .orElseThrow(() -> new RuntimeException("No active template found for your department and position"));

        Optional<SelfAssessmentForm> existingForm = formRepository.findByEmployeeAndCycle(employee, activeCycle);

        if (existingForm.isPresent()) {
            SelfAssessmentForm form = existingForm.get();
            if (isDeadlinePassed(activeCycle) && form.getStatus() == SelfAssessmentFormStatus.DRAFT) {
                form.setStatus(SelfAssessmentFormStatus.NOT_SUBMITTED);
                formRepository.save(form);
                throw new RuntimeException("Deadline has passed. Your draft was marked as not submitted.");
            }
            return form;
        }

        SelfAssessmentForm newForm = new SelfAssessmentForm();
        newForm.setEmployee(employee);
        newForm.setTemplate(template);
        newForm.setCycle(activeCycle);
        newForm.setStatus(SelfAssessmentFormStatus.DRAFT);
        newForm.setCreatedDate(Instant.now());

        List<SelfAssessmentFormAnswer> answers = new ArrayList<>();
        for (SelfAssessmentFormTemplateQuestion tq : template.getQuestions()) {
            SelfAssessmentFormAnswer answer = new SelfAssessmentFormAnswer();
            answer.setQuestionText(tq.getQuestionText());
            answer.setSortOrder(tq.getSortOrder());
            answer.setForm(newForm);
            answers.add(answer);
        }
        newForm.setAnswers(answers);

        return formRepository.save(newForm);
    }

    private void updateAnswers(SelfAssessmentForm form, List<AnswerRequest> answerRequests) {
        if (answerRequests == null) return;

        for (AnswerRequest ar : answerRequests) {
            for (SelfAssessmentFormAnswer answer : form.getAnswers()) {
                if (answer.getId().equals(ar.id())) {
                    if (ar.yesNoAnswer() != null) {
                        answer.setYesNoAnswer(ar.yesNoAnswer());
                        if (ar.yesNoAnswer().equals("Yes") && ar.rating() != null) {
                            if (ar.rating() < 3 || ar.rating() > 5) {
                                answer.setRating(null);
                            } else {
                                answer.setRating(ar.rating());
                            }
                        } else if (ar.yesNoAnswer().equals("No") && ar.rating() != null) {
                            if (ar.rating() < 1 || ar.rating() > 2) {
                                answer.setRating(null);
                            } else {
                                answer.setRating(ar.rating());
                            }
                        }
                    }
                    if (ar.remarks() != null) {
                        answer.setRemarks(ar.remarks());
                    }
                    break;
                }
            }
        }
    }

    private void syncExistingFormsWithTemplate(SelfAssessmentFormTemplate template) {
        List<SelfAssessmentForm> forms = formRepository.findByTemplate(template);
        for (SelfAssessmentForm form : forms) {
            if (!isEditableFormStatus(form.getStatus())) {
                continue;
            }

            Map<Integer, SelfAssessmentFormAnswer> existingBySortOrder = new HashMap<>();
            for (SelfAssessmentFormAnswer existingAnswer : form.getAnswers()) {
                existingBySortOrder.put(existingAnswer.getSortOrder(), existingAnswer);
            }

            form.clearAnswers();
            for (SelfAssessmentFormTemplateQuestion templateQuestion : template.getQuestions()) {
                SelfAssessmentFormAnswer answer = new SelfAssessmentFormAnswer();
                answer.setQuestionText(templateQuestion.getQuestionText());
                answer.setSortOrder(templateQuestion.getSortOrder());

                SelfAssessmentFormAnswer oldAnswer = existingBySortOrder.get(templateQuestion.getSortOrder());
                if (oldAnswer != null) {
                    answer.setYesNoAnswer(oldAnswer.getYesNoAnswer());
                    answer.setRating(oldAnswer.getRating());
                    answer.setRemarks(oldAnswer.getRemarks());
                }

                form.addAnswer(answer);
            }
            form.setUpdatedDate(Instant.now());
        }
    }

    private boolean isEditableFormStatus(SelfAssessmentFormStatus status) {
        return status == SelfAssessmentFormStatus.DRAFT
                || status == SelfAssessmentFormStatus.REOPENED
                || status == SelfAssessmentFormStatus.NOT_SUBMITTED;
    }

    private void validateAllAnswersAnswered(SelfAssessmentForm form) {
        for (SelfAssessmentFormAnswer answer : form.getAnswers()) {
            if (answer.getYesNoAnswer() == null || answer.getRating() == null) {
                throw new RuntimeException("All questions must be answered before submission. Missing answer for: " + answer.getQuestionText());
            }
        }
    }

    private void calculateScore(SelfAssessmentForm form) {
        int totalPoints = form.getAnswers().stream()
                .filter(a -> a.getRating() != null)
                .mapToInt(SelfAssessmentFormAnswer::getRating)
                .sum();
        int numQuestions = form.getAnswers().size();
        double score = numQuestions > 0 ? ((double) totalPoints / (numQuestions * 5)) * 100 : 0.0;

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

    private boolean isDeadlinePassed(TimeSetting cycle) {
        return LocalDate.now().isAfter(cycle.getEndDate());
    }

    private TimeSetting getActiveCycle() {
        return timeSettingRepository.findFirstByOrderByIdAsc().orElse(null);
    }

    private boolean isPermanentEmployee(Employee employee) {
        return employee != null
                && employee.getStaffType() != null
                && employee.getStaffType().getId() == StaffTypes.PERMANENT;
    }

    private boolean canManagerReview(SelfAssessmentForm form, Employee manager) {
        return form.getEmployee().getDepartment().getManagerId() != null
                && form.getEmployee().getDepartment().getManagerId().equals(manager.getId());
    }

    private SelfAssessmentFormTemplateDto toTemplateDto(SelfAssessmentFormTemplate template) {
        List<QuestionDto> questions = template.getQuestions().stream()
                .map(q -> new QuestionDto(q.getId(), q.getQuestionText(), q.getSortOrder(), q.getCreatedBy(), q.getCreatedOn()))
                .collect(Collectors.toList());

        return new SelfAssessmentFormTemplateDto(
                template.getId(),
                template.getDepartment().getId(),
                template.getDepartment().getName(),
                template.getPosition().getId(),
                template.getPosition().getName(),
                template.isActive(),
                questions,
                template.getCreatedOn(),
                template.getCreatedBy()
        );
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
                form.getCycle() != null ? form.getCycle().getYearType() : null,
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
                employeeInfo,
                form.getStatus().name(),
                form.getTotalScore(),
                form.getRatingCategory(),
                form.getSubmittedDate(),
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