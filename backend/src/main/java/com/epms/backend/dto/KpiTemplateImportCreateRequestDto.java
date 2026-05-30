package com.epms.backend.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class KpiTemplateImportCreateRequestDto {

    private String name;
    private String type; // INDIVIDUAL, DEPARTMENT, POSITION
    private Long departmentId;
    private Long positionId;
    private List<ImportItemDto> items;

    @Data
    public static class ImportItemDto {
        private String name;
        private String category;
        private String target;
        private String unit;
        private BigDecimal weight;
    }
}
