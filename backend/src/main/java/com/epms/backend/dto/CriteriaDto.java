package com.epms.backend.dto;

import lombok.Data;

@Data
public class CriteriaDto {
    private Long id;
    private String name;
    private String description;
    private boolean active;
}
