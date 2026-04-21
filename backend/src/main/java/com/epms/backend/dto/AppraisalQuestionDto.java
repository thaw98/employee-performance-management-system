package com.epms.backend.dto;

import lombok.Data;

@Data
public class AppraisalQuestionDto {
    private Long id;
    private Long categoryId;
    private String questionText;
    private String answerType;
    private Boolean isRequired;
    private Integer sortOrder;
    private Boolean status;
}
