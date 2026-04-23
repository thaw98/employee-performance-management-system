package com.epms.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class KpiUpdateDTO {
    private String actual;
    private String remarks;
    private Double score;
    private Double weightedScore;
}