package com.epms.backend.dto.feedbackmanagement;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class FormConfigResponse {
    private Long templateId;
    private String templateName;
    private Integer maxRating;
    private List<CriteriaDto> criteria;

    @Data
    @Builder
    public static class CriteriaDto {
        private Long id;
        private String name;
        private String description;
    }
}
