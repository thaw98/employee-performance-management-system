package com.epms.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TimeSettingDto {
    private String yearType;
    private String pendingYearType;
    private LocalDate startDate;
    private LocalDate endDate;
    private String duration;
    private String periodType;
    private List<PeriodDto> periods;
}
