package com.epms.backend.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class KpiTemplateImportValidationResponseDto {

    private int totalRows;
    private int validRows;
    private int invalidRows;
    private List<ValidRow> validRowData;
    private List<InvalidRow> invalidRowsData;

    @Data
    public static class ValidRow {
        private int rowNumber;
        private String name;
        private String category;
        private String target;
        private String unit;
        private BigDecimal weight;
    }

    @Data
    public static class InvalidRow {
        private int rowNumber;
        private String name;
        private String category;
        private String target;
        private String unit;
        private BigDecimal weight;
        private List<String> errors;
    }
}
