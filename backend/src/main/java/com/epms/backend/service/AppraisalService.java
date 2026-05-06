package com.epms.backend.service;

import com.epms.backend.dto.AppraisalCategoryDto;
import com.epms.backend.dto.AppraisalQuestionDto;
import com.epms.backend.dto.AppraisalTemplateDto;
import com.epms.backend.entity.*;
import com.epms.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppraisalService {

    private final AppraisalCategoryRepository categoryRepository;
    private final AppraisalQuestionRepository questionRepository;
    private final AppraisalTemplateRepository templateRepository;
    private final PositionRepository positionRepository;
    private final DepartmentPositionRepository departmentPositionRepository;
    private final AppraisalAssignmentRepository assignmentRepository;
    private final EmployeeReportingHistoryRepository reportingHistoryRepository;
    private final AppraisalCycleRepository appraisalCycleRepository;
    private final EmployeeRepository employeeRepository;

    @Transactional
    public void distributeAppraisalsToManagers() {
        List<AppraisalTemplate> activeTemplates = templateRepository.findAllByIsActiveTrue();
        AppraisalTemplate template = activeTemplates.isEmpty() ? null : activeTemplates.get(activeTemplates.size() - 1);
        
        if (template == null) {
            throw new RuntimeException("No active appraisal template found. Please confirm a template first.");
        }

        if (template.getTargetDepartmentPositions() == null || template.getTargetDepartmentPositions().isEmpty()) {
            throw new RuntimeException("No target positions defined in the active template.");
        }

        List<AppraisalCycle> activeCycles = appraisalCycleRepository.findByStatusIgnoreCase("Active");
        AppraisalCycle activeCycle = activeCycles.isEmpty() ? null : activeCycles.get(activeCycles.size() - 1);

        if (activeCycle == null) {
            AppraisalCycle cycle = new AppraisalCycle();
            cycle.setName("Annual Appraisal " + java.time.LocalDate.now().getYear());
            cycle.setStatus("Active");
            cycle.setStartDate(java.time.LocalDate.now());
            cycle.setEndDate(java.time.LocalDate.now().plusMonths(1));
            activeCycle = appraisalCycleRepository.save(cycle);
        }

        int count = 0;
        StringBuilder errorLog = new StringBuilder();

        for (DepartmentPosition mapping : template.getTargetDepartmentPositions()) {
            // Find Department Head for this specific department
            Department dept = mapping.getDepartment();
            if (dept == null) continue;

            if (dept.getManagerId() == null) {
                errorLog.append("Department '").append(dept.getName()).append("' has no Department Head assigned. ");
                continue;
            }

            Employee departmentHead = employeeRepository.findById(dept.getManagerId()).orElse(null);
            if (departmentHead == null) {
                errorLog.append("Department Head with ID ").append(dept.getManagerId()).append(" not found in records. ");
                continue;
            }

            List<Employee> employees = employeeRepository.findByDepartmentPosition_Id(mapping.getId());
            for (Employee employee : employees) {
                // Skip if the employee is the department head themselves
                if (employee.getId().equals(departmentHead.getId())) continue;

                // Create or Update Assignment
                AppraisalAssignment assignment = assignmentRepository
                        .findByEmployee_IdAndPeriod_Id(employee.getId(), activeCycle.getId())
                        .orElse(new AppraisalAssignment());

                assignment.setEmployee(employee);
                assignment.setPeriod(activeCycle);
                assignment.setEvaluator(departmentHead); // Assign to Department Head
                assignment.setStatus(AppraisalStatus.PENDING_MANAGER);
                assignment.setUpdatedAt(java.time.Instant.now());
                
                assignmentRepository.save(assignment);
                count++;
            }
        }
        
        if (count == 0) {
            String message = "No assignments were created. ";
            if (errorLog.length() > 0) {
                message += "Issues found: " + errorLog.toString();
            } else {
                message += "Ensure the selected positions have active employees assigned to them.";
            }
            throw new RuntimeException(message);
        }
    }

    // Category CRUD
    public List<AppraisalCategoryDto> getAllCategories() {
        return categoryRepository.findAllByOrderBySortOrderAsc().stream()
                .map(this::mapToCategoryDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public AppraisalCategoryDto createCategory(AppraisalCategoryDto dto) {
        if (categoryRepository.existsByName(dto.getName())) {
            throw new RuntimeException("Category name must be unique");
        }
        AppraisalCategory category = new AppraisalCategory();
        category.setName(dto.getName());
        category.setDescription(dto.getDescription());
        category.setStatus(dto.getStatus() != null ? dto.getStatus() : true);
        category.setSortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : 0);
        return mapToCategoryDto(categoryRepository.save(category));
    }

    @Transactional
    public AppraisalCategoryDto updateCategory(Long id, AppraisalCategoryDto dto) {
        AppraisalCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        
        if (categoryRepository.existsByNameAndIdNot(dto.getName(), id)) {
            throw new RuntimeException("Category name must be unique");
        }
        
        category.setName(dto.getName());
        category.setDescription(dto.getDescription());
        category.setStatus(dto.getStatus());
        category.setSortOrder(dto.getSortOrder());
        return mapToCategoryDto(categoryRepository.save(category));
    }

    @Transactional
    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }

    // Question CRUD
    public List<AppraisalQuestionDto> getQuestionsByCategory(Long categoryId) {
        return questionRepository.findByCategoryIdOrderBySortOrderAsc(categoryId).stream()
                .map(this::mapToQuestionDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public AppraisalQuestionDto createQuestion(AppraisalQuestionDto dto) {
        AppraisalCategory category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));
        
        AppraisalQuestion question = new AppraisalQuestion();
        question.setCategory(category);
        question.setQuestionText(dto.getQuestionText());
        question.setAnswerType(dto.getAnswerType());
        question.setIsRequired(dto.getIsRequired() != null ? dto.getIsRequired() : true);
        question.setSortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : 0);
        question.setStatus(dto.getStatus() != null ? dto.getStatus() : true);
        
        return mapToQuestionDto(questionRepository.save(question));
    }

    @Transactional
    public AppraisalQuestionDto updateQuestion(Long id, AppraisalQuestionDto dto) {
        AppraisalQuestion question = questionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Question not found"));
        
        question.setQuestionText(dto.getQuestionText());
        question.setAnswerType(dto.getAnswerType());
        question.setIsRequired(dto.getIsRequired());
        question.setSortOrder(dto.getSortOrder());
        question.setStatus(dto.getStatus());
        
        return mapToQuestionDto(questionRepository.save(question));
    }

    @Transactional
    public void deleteQuestion(Long id) {
        questionRepository.deleteById(id);
    }

    @Transactional
    public void finalizeAppraisal(AppraisalTemplateDto dto) {
        // Reset all categories finalize flag
        List<AppraisalCategory> allCategories = categoryRepository.findAll();
        allCategories.forEach(c -> c.setIsFinalized(false));
        
        // Deactivate previous active templates
        List<AppraisalTemplate> activeTemplates = templateRepository.findAllByIsActiveTrue();
        activeTemplates.forEach(t -> {
            t.setIsActive(false);
            templateRepository.save(t);
        });

        // Create new Template
        AppraisalTemplate template = new AppraisalTemplate();
        template.setName(dto.getName() != null ? dto.getName() : "Appraisal Form " + java.time.LocalDate.now().getYear());
        template.setAssessmentDate(dto.getAssessmentDate());
        template.setEffectiveDate(dto.getEffectiveDate());
        template.setIsActive(true);

        List<AppraisalCategory> selected = categoryRepository.findAllById(dto.getCategoryIds());
        selected.forEach(c -> c.setIsFinalized(true));
        template.setCategories(selected);

        if (dto.getPositionIds() != null && !dto.getPositionIds().isEmpty()) {
            List<DepartmentPosition> mappings = departmentPositionRepository.findAllById(dto.getPositionIds());
            template.setTargetDepartmentPositions(mappings);
        }

        template.setMaxRating(dto.getMaxRating() != null ? dto.getMaxRating() : 5);

        templateRepository.save(template);
    }

    public AppraisalTemplateDto getCurrentTemplate() {
        List<AppraisalTemplate> activeTemplates = templateRepository.findAllByIsActiveTrue();
        if (activeTemplates.isEmpty()) return null;
        
        // Pick the latest one
        return mapToTemplateDto(activeTemplates.get(activeTemplates.size() - 1));
    }

    public List<AppraisalTemplateDto> getAllTemplates() {
        return templateRepository.findAll().stream()
                .map(this::mapToTemplateDto)
                .sorted((a, b) -> b.getId().compareTo(a.getId()))
                .collect(Collectors.toList());
    }

    private AppraisalTemplateDto mapToTemplateDto(AppraisalTemplate t) {
        AppraisalTemplateDto dto = new AppraisalTemplateDto();
        dto.setId(t.getId());
        dto.setName(t.getName());
        dto.setAssessmentDate(t.getAssessmentDate());
        dto.setEffectiveDate(t.getEffectiveDate());
        dto.setIsActive(t.getIsActive());
        dto.setCategoryIds(t.getCategories().stream().map(AppraisalCategory::getId).collect(Collectors.toList()));
        if (t.getTargetDepartmentPositions() != null) {
            dto.setPositionIds(t.getTargetDepartmentPositions().stream().map(DepartmentPosition::getId).collect(Collectors.toList()));
        }
        dto.setMaxRating(t.getMaxRating());
        return dto;
    }

    // Mappers
    private AppraisalCategoryDto mapToCategoryDto(AppraisalCategory entity) {
        AppraisalCategoryDto dto = new AppraisalCategoryDto();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        dto.setStatus(entity.getStatus());
        dto.setSortOrder(entity.getSortOrder());
        dto.setIsFinalized(entity.getIsFinalized());
        return dto;
    }

    private AppraisalQuestionDto mapToQuestionDto(AppraisalQuestion entity) {
        AppraisalQuestionDto dto = new AppraisalQuestionDto();
        dto.setId(entity.getId());
        dto.setCategoryId(entity.getCategory().getId());
        dto.setQuestionText(entity.getQuestionText());
        dto.setAnswerType(entity.getAnswerType());
        dto.setIsRequired(entity.getIsRequired());
        dto.setSortOrder(entity.getSortOrder());
        dto.setStatus(entity.getStatus());
        return dto;
    }
}
