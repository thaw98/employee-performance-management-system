package com.epms.backend.dto;

//MNA
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class KpiUpdateDTO {
    private String actual;
    private Double score;
    private Double weightedScore;
}
