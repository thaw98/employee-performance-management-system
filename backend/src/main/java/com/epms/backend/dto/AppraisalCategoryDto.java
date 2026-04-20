package com.epms.backend.dto;

import lombok.Data;

@Data
public class AppraisalCategoryDto {
    private Long id;
    private String name;
    private String description;
    private Boolean status;
}
