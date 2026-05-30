package com.epms.backend.dto.selfassessmentform;

import lombok.Data;

import java.util.List;

@Data
public class SelfAssessmentTemplateImportValidationResponseDto {

    private int totalRows;
    private int validRows;
    private int invalidRows;
    private List<ValidRow> validRowData;
    private List<InvalidRow> invalidRowsData;

    @Data
    public static class ValidRow {
        private int rowNumber;
        private String questionText;
    }

    @Data
    public static class InvalidRow {
        private int rowNumber;
        private String questionText;
        private List<String> errors;
    }
}
