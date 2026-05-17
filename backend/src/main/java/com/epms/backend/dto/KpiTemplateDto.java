package com.epms.backend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class KpiTemplateDto {
    private Long id;
    private String name;
    private String type;
    private Long departmentId;
    private Long positionId;
    private List<KpiTemplateItemDto> items;

    @Data
    public static class KpiTemplateItemDto {
        private String name;
        private String category;
        private String target;
        private String unit;
        private BigDecimal weight;
    }
}
