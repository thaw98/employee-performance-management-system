package com.epms.backend.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class AppraisalTemplateDto {
    private Long id;
    private String name;
    private LocalDate assessmentDate;
    private LocalDate effectiveDate;
    private Boolean isActive;
    private List<Long> categoryIds;
    private List<Long> positionIds;
    private Integer maxRating;
    private Long reviewCycleId;
    private LocalDate deadlineDate;
    private LocalDate createdAt;
}
