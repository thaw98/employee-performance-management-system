package com.epms.backend.service;

import com.epms.backend.dto.AppraisalCategoryDto;
import com.epms.backend.dto.AppraisalQuestionDto;
import com.epms.backend.dto.AppraisalTemplateDto;
import com.epms.backend.entity.AppraisalCategory;
import com.epms.backend.entity.AppraisalQuestion;
import com.epms.backend.entity.AppraisalTemplate;
import com.epms.backend.entity.Position;
import com.epms.backend.repository.AppraisalCategoryRepository;
import com.epms.backend.repository.AppraisalQuestionRepository;
import com.epms.backend.repository.AppraisalTemplateRepository;
import com.epms.backend.repository.PositionRepository;
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
        templateRepository.findByIsActiveTrue().ifPresent(t -> {
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
            List<Position> positions = positionRepository.findAllById(dto.getPositionIds());
            template.setTargetPositions(positions);
        }

        templateRepository.save(template);
    }

    public AppraisalTemplateDto getCurrentTemplate() {
        return templateRepository.findByIsActiveTrue()
                .map(this::mapToTemplateDto).orElse(null);
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
        if (t.getTargetPositions() != null) {
            dto.setPositionIds(t.getTargetPositions().stream().map(Position::getId).collect(Collectors.toList()));
        }
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
