package com.epms.backend.dto.feedbackmanagement;

import lombok.Data;

import java.util.List;

@Data
public class FeedbackTemplateImportValidationResponseDto {

    private int totalRows;
    private int validRows;
    private int invalidRows;
    private List<ValidRow> validRowData;
    private List<InvalidRow> invalidRowsData;

    @Data
    public static class ValidRow {
        private int rowNumber;
        private String criteriaName;
        private String description;
        private Long existingCriteriaId;
    }

    @Data
    public static class InvalidRow {
        private int rowNumber;
        private String criteriaName;
        private String description;
        private List<String> errors;
    }
}
