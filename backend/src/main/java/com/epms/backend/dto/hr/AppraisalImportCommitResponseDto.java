package com.epms.backend.dto.hr;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AppraisalImportCommitResponseDto {
    private Boolean success;
    private String message;
    private Integer createdCategoryCount;
    private Integer reusedCategoryCount;
    private Integer createdQuestionCount;
    private Integer reusedQuestionCount;
    private Integer failedCount;
}
