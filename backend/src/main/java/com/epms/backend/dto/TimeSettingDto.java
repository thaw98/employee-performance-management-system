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

    public String getYearType() { return yearType; }
    public void setYearType(String yearType) { this.yearType = yearType; }

    public String getPendingYearType() { return pendingYearType; }
    public void setPendingYearType(String pendingYearType) { this.pendingYearType = pendingYearType; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }

    public String getPeriodType() { return periodType; }
    public void setPeriodType(String periodType) { this.periodType = periodType; }

    public List<PeriodDto> getPeriods() { return periods; }
    public void setPeriods(List<PeriodDto> periods) { this.periods = periods; }
}
