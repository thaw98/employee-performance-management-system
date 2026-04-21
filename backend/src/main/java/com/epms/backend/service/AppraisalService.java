package com.epms.backend.service;

import com.epms.backend.dto.AppraisalCategoryDto;
import com.epms.backend.dto.AppraisalQuestionDto;
import com.epms.backend.entity.AppraisalCategory;
import com.epms.backend.entity.AppraisalQuestion;
import com.epms.backend.repository.AppraisalCategoryRepository;
import com.epms.backend.repository.AppraisalQuestionRepository;
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

    // Mappers
    private AppraisalCategoryDto mapToCategoryDto(AppraisalCategory entity) {
        AppraisalCategoryDto dto = new AppraisalCategoryDto();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        dto.setStatus(entity.getStatus());
        dto.setSortOrder(entity.getSortOrder());
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
